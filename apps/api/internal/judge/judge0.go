// Package judge talks to a Judge0 CE sandbox. Judge0 executes code inside `isolate`
// (cgroups + namespaces); we additionally force network off and pass CPU/memory limits.
package judge

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/codingfoding/api/internal/domain"
)

// Judge0 CE language ids.
var languageIDs = map[string]int{
	"c": 50, "cpp": 54, "go": 60, "java": 62, "python": 71, "javascript": 63,
}

type Judge0 struct {
	baseURL string
	token   string
	http    *http.Client
}

func NewJudge0(baseURL, token string) *Judge0 {
	return &Judge0{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

type submitReq struct {
	SourceCode     string  `json:"source_code"`
	LanguageID     int     `json:"language_id"`
	Stdin          string  `json:"stdin"`
	ExpectedOutput string  `json:"expected_output"`
	CPUTimeLimit   float64 `json:"cpu_time_limit"`
	MemoryLimit    int32   `json:"memory_limit"`
	EnableNetwork  bool    `json:"enable_network"`
}

type submitResp struct {
	Status struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
	Time    *string `json:"time"`
	Memory  *int32  `json:"memory"`
	Message *string `json:"message"`
}

func b64(s string) string { return base64.StdEncoding.EncodeToString([]byte(s)) }

func (j *Judge0) Run(ctx context.Context, language, source string, tc domain.TestCase, timeLimitMS, memoryLimitKB int32) (domain.Verdict, error) {
	langID, ok := languageIDs[language]
	if !ok {
		return domain.Verdict{}, fmt.Errorf("judge0: unsupported language %q", language)
	}
	body, _ := json.Marshal(submitReq{
		SourceCode: b64(source), LanguageID: langID, Stdin: b64(tc.Stdin), ExpectedOutput: b64(tc.ExpectedStdout),
		CPUTimeLimit: float64(timeLimitMS) / 1000, MemoryLimit: memoryLimitKB, EnableNetwork: false,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		j.baseURL+"/submissions?base64_encoded=true&wait=true&fields=status,time,memory,message", bytes.NewReader(body))
	if err != nil {
		return domain.Verdict{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	if j.token != "" {
		req.Header.Set("X-Auth-Token", j.token)
	}
	resp, err := j.http.Do(req)
	if err != nil {
		return domain.Verdict{}, fmt.Errorf("judge0: request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return domain.Verdict{}, fmt.Errorf("judge0: status %d: %s", resp.StatusCode, b)
	}
	var r submitResp
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&r); err != nil {
		return domain.Verdict{}, fmt.Errorf("judge0: decode: %w", err)
	}
	return toVerdict(r), nil
}

func toVerdict(r submitResp) domain.Verdict {
	v := domain.Verdict{MemoryKB: r.Memory}
	if r.Time != nil {
		if secs, err := strconv.ParseFloat(*r.Time, 64); err == nil {
			ms := int32(secs * 1000)
			v.RuntimeMS = &ms
		}
	}
	switch id := r.Status.ID; {
	case id == 3:
		v.Status = domain.SubmissionAccepted
	case id == 4:
		v.Status = domain.SubmissionWrongAnswer
	case id == 5:
		v.Status = domain.SubmissionTimeLimit
	case id == 6:
		v.Status = domain.SubmissionCompileError
		v.Detail = "compilation failed"
	case id >= 7 && id <= 12:
		v.Status = domain.SubmissionRuntimeError
		v.Detail = r.Status.Description
		// SIGKILL from the cgroup OOM killer surfaces as a runtime error.
		if id == 7 && r.Message != nil && strings.Contains(*r.Message, "memory") {
			v.Status = domain.SubmissionMemoryLimit
		}
	default:
		v.Status = domain.SubmissionInternalError
		v.Detail = "sandbox error"
	}
	return v
}
