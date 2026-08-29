# Security Policy

## Supported versions

Only the latest published `create-eziwiki` release and the `main` branch
receive fixes. A scaffolded wiki records the release it came from in its
`package.json` under `eziwiki.version`.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
vulnerability reporting for this repository:

<https://github.com/i3months/eziwiki/security/advisories/new>

You will get an acknowledgement within a few days. Once a fix is published the
report is credited in the release notes unless you ask otherwise.

## What is in scope

eziwiki builds a static site from Markdown that the wiki's own authors write.
Raw HTML in that Markdown is passed through on purpose, so anything an author
can write, the page can run — that is a feature for a single trusted author and
a risk the moment a wiki accepts contributions. A wiki that takes pull requests
should review them as it would review code.

Reports are welcome for anything that lets **content or configuration that an
author did not write** run in a reader's browser, or that lets a build read or
write outside the project directory — for example a crafted file name, a
dependency, or the scaffolder acting on an untrusted input.
