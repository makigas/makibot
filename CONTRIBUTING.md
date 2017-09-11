# Contributing to this project

Thank you for taking your time to contribute in some way to this project, reporting issues or providing suggestions or performing code reviews. These are the contributing guidelines for this project.

By contributing to this project we assume you have already read this contributing guidelines and you agree to them. Please, do not contribute to the project if you don't agree with the contents of this document.

## 1. Reporting issues

If you have multiple topics to report, send multiple issues. Issues are free to create, so don't worry; send 5 issues in a batch if you need.

Why? Well: the issue tracker will assign an unique number to each issue. It is important to keep the issues limited to one topic per issue because it makes tracing the reports easier, specially when it comes to bug reports. If you send a single issue with a lot of questions or unrelated bugs, it makes hard to know when an issue is actually fixed. If you send a single issue with a lot of unrelated issues inside, you may be requested to submit again your issue following this rule and your original issue may be closed.

## 2. Sending pull requests

Pull requests allows you to introduce new features or correct files in this repository. This project accepts pull requests. Follow these rules and the chances of having your PR merged will increase.

## 2.1 Create a tracking issue first!

If your pull request is trivial (a typo, a semicolon, linting...) this rule
does not apply because it would be overkill.

However, if your PR covers a non-trivial feature, please, create a tracking
issue first, by sending an issue describing the feature you will be working on.
The tracking issue is used as an RFC where other people can add comments or
provide feedback on the new feature (or, in some rare cases, to reject the new
feature). Plus, this allows other developers to know about new code coming in
so that no one can be surprised about new code or overlapping new features.

## 2.2 Don't work on top of master branch

**Always make a feature branch**. Sending a PR from master branch is usually
a bad idea, since your master branch could be out of date and new commits may
have been already merged, causing a lot of pain. Always work on a separate
branch, so that you can backport commits from `upstream/master` if needed.

## 2.3 Contributing License Agreement

This is a small project so no CLA is being enforced to contribute on this
project. However, by sending code to this project you agree to release it under
the project license. See the LICENSE file for details on that.

Also, by contributing code to the project you confirm that you are allowed to
contribute that code (i.e., it's not copied and pasted code taken from some
other project or code under a more restrictive copyright license).