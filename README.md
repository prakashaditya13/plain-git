# 🚀 plain-git  
### _Operate Git in plain English — a fully interactive, human-friendly Git CLI_

![banner](https://dummyimage.com/1200x200/222/fff&text=plain-git)  

---

## 📦 What is plain-git?

**plain-git** is a modern, interactive Git CLI that lets developers perform Git operations using **plain English**, guided prompts, clean menus, and a manager-driven architecture.

Think of it as:

> **Git for humans.**  
> **A command palette inside your terminal.**  
> **Zero memorization + maximum productivity.**

---

## ✨ Features

### 🖥 Beautiful interactive CLI  
- ASCII banner  
- Color-coded logs  
- Scrollable menus  
- Current branch indicator  
- Clear grouped categories  

### 🧠 Full Manager-Based Architecture  
Every domain of Git is isolated into a clean “Manager”:

| Manager | Responsibilities |
|--------|------------------|
| **RepositoryManager** | init, clone, status, config, remotes, fsck, GC |
| **BranchManager** | create, rename, switch, delete, push upstream |
| **CommitManager** | stage, unstage, commit, amend, logs, diffs |
| **RemoteManager** | remotes, push, pull, fetch, sync |
| **StashManager** | stash create/apply/pop/drop/clear |
| **TagManager** | tags (LS, create, annotate, delete, push) |
| **MergeManager** | merge, conflicts, abort/continue |
| **ConflictManager** | conflict markers, editor open, diff |
| **RebaseManager** | rebase, interactive, skip/continue/abort |
| **HistoryManager** | history, reflog, diff, blame |
| **ResetManager** | soft/mixed/hard reset, discard changes |

Everything runs interactively — no need to remember Git syntax.

---

## 🧪 Full Test Suite (Vitest)

plain-git ships with complete tests for:

- RepositoryManager  
- BranchManager  
- CommitManager  
- RemoteManager  
- StashManager  
- TagManager  
- MergeManager  
- ConflictManager  
- RebaseManager  
- HistoryManager  
- ResetManager  

With:

- Mocks for `inquirer`, `execSync`, `fs`
- Fully isolated sandbox environment
- Deterministic CI behavior  
- Zero real Git side effects

---

## 🔧 Installation

```bash
npm install -g plain-git
