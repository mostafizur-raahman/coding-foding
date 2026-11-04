package service

import (
	"bytes"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"strings"
	"testing"
)

func encodePNG(t *testing.T, w, h int, fill func(x, y int) color.Color) []byte {
	t.Helper()
	img := image.NewNRGBA(image.Rect(0, 0, w, h))
	for y := range h {
		for x := range w {
			img.Set(x, y, fill(x, y))
		}
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func TestProcessAvatarCropsAndScalesToJPEG(t *testing.T) {
	// 600×300: left and right thirds blue, middle red. A centred square crop keeps
	// the red middle (plus a little blue at the very edges).
	src := encodePNG(t, 600, 300, func(x, _ int) color.Color {
		if x >= 150 && x < 450 {
			return color.NRGBA{255, 0, 0, 255}
		}
		return color.NRGBA{0, 0, 255, 255}
	})
	out, err := ProcessAvatar(bytes.NewReader(src))
	if err != nil {
		t.Fatal(err)
	}
	img, format, err := image.Decode(bytes.NewReader(out))
	if err != nil || format != "jpeg" {
		t.Fatalf("output not a JPEG: %v %q", err, format)
	}
	if b := img.Bounds(); b.Dx() != avatarSize || b.Dy() != avatarSize {
		t.Fatalf("size %v, want %dx%d", b, avatarSize, avatarSize)
	}
	r, g, b, _ := img.At(avatarSize/2, avatarSize/2).RGBA()
	if r>>8 < 200 || g>>8 > 60 || b>>8 > 60 {
		t.Fatalf("centre should be red after a centre crop, got %d,%d,%d", r>>8, g>>8, b>>8)
	}
}

func TestProcessAvatarRejectsNonImages(t *testing.T) {
	_, err := ProcessAvatar(strings.NewReader("<?php echo 'hi'; ?> pretending to be photo.jpg"))
	if !errors.Is(err, ErrAvatarFormat) {
		t.Fatalf("want ErrAvatarFormat, got %v", err)
	}
	var g bytes.Buffer
	_ = gif.Encode(&g, image.NewPaletted(image.Rect(0, 0, 4, 4), []color.Color{color.Black}), nil)
	if _, err := ProcessAvatar(&g); !errors.Is(err, ErrAvatarFormat) {
		t.Fatalf("gif: want ErrAvatarFormat, got %v", err)
	}
}

// A tiny PNG whose header claims 60000×60000 pixels: must be refused from the header
// alone, before any attempt to decode (and allocate) the image.
func TestProcessAvatarRefusesDecompressionBombs(t *testing.T) {
	var ihdr bytes.Buffer
	_ = binary.Write(&ihdr, binary.BigEndian, uint32(60000))
	_ = binary.Write(&ihdr, binary.BigEndian, uint32(60000))
	ihdr.Write([]byte{8, 2, 0, 0, 0}) // 8-bit RGB
	chunk := append([]byte("IHDR"), ihdr.Bytes()...)
	var bomb bytes.Buffer
	bomb.Write([]byte("\x89PNG\r\n\x1a\n"))
	_ = binary.Write(&bomb, binary.BigEndian, uint32(ihdr.Len()))
	bomb.Write(chunk)
	_ = binary.Write(&bomb, binary.BigEndian, crc32.ChecksumIEEE(chunk))
	if _, err := ProcessAvatar(&bomb); !errors.Is(err, ErrAvatarDims) {
		t.Fatalf("want ErrAvatarDims, got %v", err)
	}
}

func TestProcessAvatarSizeLimit(t *testing.T) {
	big := bytes.Repeat([]byte{0xff}, AvatarMaxBytes+1)
	if _, err := ProcessAvatar(bytes.NewReader(big)); !errors.Is(err, ErrAvatarTooLarge) {
		t.Fatalf("want ErrAvatarTooLarge, got %v", err)
	}
}

func TestProcessAvatarAcceptsJPEG(t *testing.T) {
	var buf bytes.Buffer
	_ = jpeg.Encode(&buf, image.NewRGBA(image.Rect(0, 0, 50, 80)), nil)
	if _, err := ProcessAvatar(&buf); err != nil {
		t.Fatalf("jpeg upload: %v", err)
	}
}
