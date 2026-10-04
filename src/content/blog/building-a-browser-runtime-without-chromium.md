---
title: "Building a browser runtime for automation without Chromium"
description: "Vyacheslav on building Mimic: from the idea of more affordable browser automation to a first prototype and real-world workflows."
author: "Vyacheslav Lavrov"
cover: "images/blog-building-runtime.webp"
coverAlt: "The blue Mimic mascot assembling a small glowing cube at a workbench."
published: 2026-10-04
lang: en
category: "Development diary"
---

Hi everyone. I wanted to talk about what I’ve been spending most of my time on for the past month. The project is called Mimic. It’s a browser runtime for automation without Chromium underneath.

My name is Vyacheslav. I do reverse engineering and previously worked as a malware analyst at Dr.Web. I also have a lot of backend development experience, and lately I’ve been doing more individual client work, including web automation.

## Why a lighter runtime

It started with me once again coming back to the question of how expensive browser emulation can be for people. Especially when you compare it to a script doing the same job directly at the network level. Once you start running things in parallel, resource usage is joined by stuck pages, crashed processes, running out of memory, and so on. That’s why, in my experience, some clients are terrified of browser emulation: they want stability and high throughput, but instead they also have to deal with keeping a fleet of browsers alive.

I’ve also heard the argument that this kind of automation is inherently unstable, but I only partly agree with it. Reverse engineering a proprietary protocol can also turn out to be more volatile and more expensive to maintain than interacting with the user interface. So for a long time I’ve wanted to make browser automation cheaper, so that every complicated scenario doesn’t have to be broken down into direct network requests.

## The first prototype

At the beginning of September, I decided to try. Without modern AI agents, I probably wouldn’t have taken on a project of this scale alone at all. With them, an idea that previously seemed far too expensive in terms of one person’s time started to look realistic for the first time.

For a start, I wanted to build a PoC that could get through a page protected by Cloudflare, specifically a non-interactive challenge. I came up with this gate for myself, and it was really interesting to try to pass it. I already had quite a lot of experience writing specialized solvers and analyzing anti-bot systems, but here the goal was to make a browser without anything specific to a particular site. The browser behavior had to be reproduced well enough for the check to simply run on its own.

## Matching Chrome’s behavior

By the way, I rarely look at Chromium’s source code. Most of the time I observe Chrome as a black box and look at it the same way websites do: what methods they call, what they get back, and how the result depends on previous actions. Then I reproduce that behavior in Mimic.

Architecturally, I don’t see much point in reproducing Chromium for a task like this. Otherwise, what’s the point of minimizing the runtime? A website can observe the JavaScript environment and the APIs available to it, while the server side can observe network behavior. That’s the kind of compatibility I’m interested in.

So “a browser without rendering” is still a pretty rough simplification. If a website draws something to a Canvas and then reads the result, that has to behave consistently. Geometry and text measurements don’t disappear just because we’re never going to show the page to a human.

## A working PoC

With fairly intensive development, the PoC was ready in four days: the Cloudflare check I had chosen let it through. That was really encouraging, even though the first benchmarks were actually worse than Chrome :D

The first implementation had plenty of quick solutions, so before expanding the set of websites that worked, I had to spend a lot of time on optimization. That’s probably a separate story on its own.

## Discovering Lightpanda

Early in development (yes, already after the PoC), I decided to see whether anyone else had built something similar. The last time I’d looked into this was quite a while ago, and I hadn’t found a suitable solution back then. That’s how I came across Lightpanda — a genuinely cool project. It even identifies itself to websites as Lightpanda in its default User-Agent. Its popularity was more encouraging than discouraging to me. There is some overlap between what we’re doing, but on my side I’m especially focused on matching Chrome’s observable behavior, including the things anti-bot systems check.

## Where Mimic is now

Mimic can already be tried on Windows and Linux. It has CDP, independent pages, and isolated browser contexts; the [repository](https://github.com/mimic-browser/runtime) also contains tests, compatibility research, and benchmarks with the measurement conditions described. A lot of things still don’t work, which is exactly why real-world scenarios are especially interesting right now.

I’m working on it full-time and, to be honest, it already feels like I’ve put a huge amount into it even though it’s only been a month. I like what it’s turning into and I want to keep developing it. I also recently made the website you’re reading this on, and I’m personally really happy with it. Hopefully you’ll like it too.

If you have a Playwright or Puppeteer workflow where full browsers eat a lot of memory, let’s try it on Mimic. I’d like to take a real task, check whether the result is correct and how much resources it uses, and figure out what’s still missing.

Anyway, give it a try. I’d really like to finally get closer to a childhood dream of mine — relatively cheap browser emulation and making complex automation more accessible to build. Reverse engineering the web is difficult work after all, and not many people are willing to take it on.
