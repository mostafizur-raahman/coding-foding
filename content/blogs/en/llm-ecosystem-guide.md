---
# id is permanent: votes are tied to it. Never change it.
id: cd1d6032-a16f-4093-8fca-721f136554f0
slug: llm-ecosystem-guide
title: The World of LLMs, in One Sitting
description: There's a much bigger world beyond ChatGPT. From tokens and context windows to thinking models, deep research, Artifacts and your own AI agent, the whole picture in 20 steps.
date: 2026-11-01
tags: [AI, LLM, Productivity, Tools]
---

## A story first {#story}

Imagine there's a huge library in your neighbourhood. The librarian has read nearly every book in it at least once. Whatever you ask, he gives you a tidy answer on the spot. But there are three problems:

1. He hasn't **memorised** every book; he read them and kept an impression in his head. So now and then he confidently gives the wrong date or the wrong name.
2. He **doesn't know anything that happened after** the last day he read.
3. Hand him too many papers at once and he **mixes up what was at the start**.

An LLM (Large Language Model) is exactly this librarian. In this piece we'll see how he works inside, where you can rely on him and where you can't, and which tools make him ten times more useful.

> [!tip] Who this is for
> Someone who opened ChatGPT for the first time today. And someone who writes code in Cursor every day. Every section starts with a simple picture, then the "why", then practical tips.

## The map: who's out there {#map}

### 1. The LLM world: ChatGPT isn't alone {#ecosystem}

To many people AI simply means ChatGPT. But there are now several powerful models side by side, and each has its own strengths:

| Model | Company | Usually good at |
| --- | --- | --- |
| **ChatGPT** | OpenAI | All kinds of work, voice, image generation, a big ecosystem |
| **Claude** | Anthropic | Long writing, code, understanding big documents, Artifacts |
| **Gemini** | Google | Fitting in with Google's services, long context, understanding video |
| **Grok** | xAI | Fresh news and discussion from X (Twitter) |

They aren't substitutes for each other so much as different tools. You can't undo a screw with a hammer.

> [!note] Remember
> Models change every few months. The best one today may not be in six months. So rather than becoming a fan of one, get into the habit of **choosing by the job** (more in step 6).

## How it works inside {#how-it-works}

### 2. Tokenization: the model reads pieces, not words {#tokens}

When you write "Learning how to learn", the model doesn't see letters or whole words. It breaks the text into small pieces called **tokens**. Each token has a number, and the model really works with these numbers.

```diagram
llm-tokens
A sentence breaks into tokens, and each token is a number. The model reads this row of numbers and guesses what the next token will be.
```

Why this is useful to know:

- **Prices and limits are measured in tokens.** API bills, "message too long" errors: all of them count tokens.
- **Bangla text uses more tokens.** In English one word is usually one or two tokens. Saying the same thing in Bangla often takes several times more. So long jobs in Bangla hit the limit sooner.
- **Models are weak at counting letters.** Questions like "how many r's are in strawberry?" go wrong, because the model doesn't see letters at all, only pieces.

### 3. Context window: the model's desk {#context-window}

The context window is the model's **working memory**. Everything in one conversation (what you wrote, what the model answered, the files you gave it) can be kept "in view" at once up to a certain number of tokens. Go beyond that and the older parts drop out or blur.

```diagram
context-window
New tokens come in and the window moves forward. Whatever leaves the window, the model can no longer see.
```

Think of a study desk. However big the desk, fill it with junk and the paper you need is hard to find. So:

- **Give it only what's needed.** Instead of a whole 200-page log, give the part around the error.
- **Open a new chat when you change topic.** Go from a cooking recipe to Kubernetes in one chat and everything said before sits on the desk taking up room.
- **In long chats, ask for a summary now and then**, then start a new chat with that summary.

> [!warning] A big window doesn't mean perfect recall
> Many models now have huge windows. But research has shown that in very long input, models often give less weight to information in the middle. Put important instructions at the start or the end.

### 4. A model's limits: a "lossy zip file" {#limitations}

An LLM is built by having it read a vast amount of text from the internet. But the model doesn't store those texts word for word. It squeezes the whole internet into a small "zip file", and some information is lost in the squeezing. Like a JPEG photo that goes blurry when you compress it too much.

```diagram
lossy-zip
The vast internet is squeezed into one model. Pull it back out and most of it comes back right, but some pieces are blurry or made up.
```

As a result:

- **Hallucination:** it can confidently make up things it doesn't know. Books that don't exist, wrong citations, library functions that aren't real.
- **Knowledge cutoff:** the model doesn't know about events after its training, unless it searches (see step 8).
- **Good at popular things, weak at rare ones.** A topic with thousands of pages written about it, it remembers well. A small local topic, it often gets wrong.

### 5. The most important warning: verify {#verify}

Everything above boils down to one thing: **AI answers aren't always 100% right, so verifying is mandatory.**

> [!danger] Never trust it blindly in these areas
> Medicine and health, law, money, and code that's going to production. Here the cost of one mistake is very high.

How to verify:

1. **Ask for sources**, then open the links and look yourself. Is the link real, and does it really say that?
2. **Run the code.** Write tests. "It looks right" isn't enough.
3. **Ask another model.** Two models are unlikely to make the same mistake (see the council in the next section).
4. **Check numbers and dates separately.** That's where models make the most mistakes.

## The right model for the job {#choosing}

### 6. Model selection and the "council" {#model-selection}

Not every job needs the biggest model. A fast, cheap model is enough for a short email. Thinking through a complex architecture needs a big one. A rough rule:

| Job | What to choose |
| --- | --- |
| A quick question, short writing, translation | A fast, small model |
| Understanding a long document, organising writing | A model with a big context |
| Hard maths, debugging, planning | A thinking model (step 7) |
| Fresh news | A model with search on (step 8) |

And when the answer really matters, form a **council**: ask the same question to two or three different models and put the answers side by side. Where they all agree, you can trust it more. Where they disagree, dig in yourself.

```diagram
model-council
The same question goes to three models. The answers are compared: keep what they all agree on, and check where they differ.
```

### 7. Thinking models: they think before answering {#thinking-models}

An ordinary model starts writing its answer as soon as it reads the question, a bit like doing maths in your head. A **thinking model** (reasoning model) first works step by step on a scratchpad, catches its own mistakes, tries other routes, and then answers.

They're built with **reinforcement learning**: the model is given thousands of maths and coding problems whose right answers can be checked. Right earns a reward, wrong doesn't. That way it learns how to think to reach the right answer.

- **When to use one:** hard maths, complex bugs, algorithms, multi-step planning.
- **When not to:** simple questions or short writing. Thinking models are slow and expensive. There's no point making one think for 30 seconds about "what should I cook today".

## The model's tools {#tools}

On its own, an LLM works only with the knowledge in its head. But give it **tools** and it can reach out into the world. Everything in this section is really the same idea: when the model can't do something itself, it uses a tool.

### 8. Internet search {#search}

A model's knowledge stops at its training date. Today's news, a new library's version, yesterday's prices: it doesn't know them. With search on, the model first searches the internet, then reads that fresh information to answer, and gives you links to the sources.

> [!tip] The rule
> If your question involves "latest", "now", "this year", prices, versions or news, turn search on. And open the links that come with the answer.

### 9. Deep Research {#deep-research}

Ordinary search looks once, reads a few pages and answers. **Deep Research** works like a researcher: it breaks the question into smaller parts, runs many searches, reads a few dozen sources, then writes a full report with a source next to every claim. It takes a few minutes.

Useful for: comparing a new technology, getting the whole picture of a market or topic, background reading before a thesis or proposal. But however polished the report, open the sources for the important claims yourself.

### 10. File upload: talk about your own documents {#file-uploads}

You can upload PDFs, Word files, slides, code, even photos of handwritten notes and ask questions directly: "Give me the main points of this 40-page research paper in three lines", "Where are the risks for me in this contract?", "Make a 30-day study plan from this syllabus."

Then the model answers **from the text you gave it**, not from its "blurry memory", so mistakes drop a lot. But the whole file takes up room in the context window, so for a very big file give it the part that matters.

### 11. Python interpreter: calculate, don't guess {#python}

Remember that the model sees tokens, not words? That's why big multiplications, date arithmetic or data work done "in its head" goes wrong. So good models write a small **Python program themselves, run it**, and answer from the result.

```diagram
tool-loop
A question comes in; instead of calculating itself, the model writes Python code, runs it in a sandbox, reads the result, then answers.
```

You can also tell it: "Run code to calculate this." The answer to the calculation is then far more reliable.

### 12. Data analysis and charts {#data-analysis}

Once it can run Python, the next step is easy: upload an Excel or CSV file and say "make a chart of sales by month", "which product's sales dropped the most?", "is there anything unusual in this data?". The model reads the data, writes code to analyse it, and draws you a chart.

> [!note] Keep an eye out
> Ask to see the code the model ran. A pretty chart doesn't mean the maths is right. Take a quick look at which column it calculated what from.

## Tools for building and learning {#builders}

### 13. Claude Artifacts {#artifacts}

Ask Claude to build something (a web page, a small game, a diagram, a calculator) and it **runs right away** in a separate panel next to the chat. That's called an Artifact. You look at it, click around, then say "make the button bigger", "add dark mode", and it changes on the spot.

It's wonderful for testing a UI idea, building interactive things for learning, or explaining an idea with a picture.

### 14. Cursor {#cursor}

Cursor is a code editor with AI built in (it looks like VS Code). It's not just autocomplete; it can read your whole project. Jobs like "where is this function used?" or "add rate limiting to login" it can do across several files.

> [!warning] Treat it like a junior engineer
> AI-written code is like the code of a fast but new colleague. Read every change, run the tests, then merge. Run it without understanding it and you'll spend twice the time hunting that bug later.

### 15. Advanced Voice Mode {#voice}

The old voice feature turned speech into text first, then wrote an answer and read it aloud. **Advanced voice** understands audio directly and answers in audio. So you can interrupt it mid-sentence, it picks up on tone and emotion, and the conversation feels much more natural.

Useful for: understanding a topic while out on a walk, interview practice, practising spoken English.

### 16. NotebookLM {#notebooklm}

In Google's NotebookLM you give it your own sources (PDFs, notes, websites, YouTube videos), and it works **only from those**: summaries, study guides, Q&A, and the most fun of all, a **podcast** that sounds like a conversation between two hosts. Turning your class notes into a podcast before an exam and listening to it on the bus is, in a word, great.

### 17. Multi-modality {#multimodal}

Today's models understand not just text but **images, audio and video** too. Take a photo of a broken circuit and ask where the problem is. Give it a photo of a whiteboard and ask it to write the code. Give it a screenshot of a chart and ask what it means. Build a real web page from a hand-drawn UI sketch.

### 18. Video generation {#video}

Models like Sora (OpenAI) and Veo (Google) make video from text: "rickshaws in Dhaka on a rainy night, the camera slowly moving forward". For short clips for ads, explainers, social media or teaching, they're incredible.

> [!danger] With responsibility
> Generated video looks just like the real thing. Making a fake video with someone's face or voice, or passing off a made-up event as true, is wrong, and in many countries a crime.

## Make it your own {#personalize}

### 19. Custom instructions and memory {#custom-instructions}

There's no need to write "I'm a Go backend developer, keep answers short, use few comments in code" every time. Write it once in **custom instructions** and the model follows it in every chat. Many apps also have **memory**: the model remembers your preferences and your ongoing projects.

Good custom instructions include:

- Who you are and what you work on
- The style of answer: short or detailed, language, tone
- What you don't want: unnecessary preambles, too many emoji, and so on

### 20. Custom GPTs and agents {#agents}

One step further, you can build a separate AI for one particular job: with its own instructions, its own files and its own tools. For example:

- **A language-learning companion:** gives you 10 new words a day and corrects your sentences.
- **A translator:** translates from English to Bangla following your company's own glossary.
- **A code reviewer:** reviews PRs following your team's style guide.

In ChatGPT these are called Custom GPTs, in Claude Projects, in Gemini Gems. And an **agent** goes a bit further: it doesn't just answer, it works step by step on its own, like searching, writing files and running code, and reports the result at the end.

## At a glance: what for which job {#cheat-sheet}

| You want | Use |
| --- | --- |
| A quick answer or some writing | Any ordinary model |
| Hard maths, a bug, a plan | A thinking model |
| Today's news, prices, new versions | Search |
| A full research report | Deep Research |
| To understand your own PDF or document | File upload, NotebookLM |
| Exact calculations, charts | Python / data analysis |
| To build a UI or a small tool | Claude Artifacts |
| To write code across a whole project | Cursor |
| An important decision | A council of several models, then check it yourself |
| The same kind of job again and again | Custom instructions, a Custom GPT / agent |

> [!tip] A final word
> AI won't take your place, but someone who knows how to use AI well will get ahead of you. Treat models like smart colleagues who can make mistakes: give them work, take their help, and keep the final decision and the checking in your own hands.
