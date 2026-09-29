'use server';

import { runAction } from '@/data/run-action';
import { createFile, createFolder, createProject, deleteFile, getFile, listFiles, saveFile } from '@/data/files';
import { runCode } from '@/data/runner';

// The workspace's code files and folders. Same shape as every action: runAction checks
// the user, the DAL checks ownership and input.

export async function listFilesAction() {
  return runAction((user) => listFiles(user.id));
}

export async function getFileAction(fileId: string) {
  return runAction((user) => getFile(user.id, fileId));
}

export async function createFileAction(input: { name: string; language: string; parentId?: string | null }) {
  return runAction((user) => createFile(user.id, input));
}

export async function createFolderAction(input: { name: string; parentId?: string | null }) {
  return runAction((user) => createFolder(user.id, input));
}

export async function createProjectAction(input: { name: string; template?: 'empty' | 'clean-architecture' }) {
  return runAction((user) => createProject(user.id, input));
}

export async function saveFileAction(
  fileId: string,
  changes: { content?: string; language?: string },
  expectedUpdatedAt: string,
) {
  return runAction((user) => saveFile(user.id, fileId, changes, expectedUpdatedAt));
}

export async function deleteFileAction(fileId: string) {
  return runAction((user) => deleteFile(user.id, fileId));
}

/** Runs code in the sandboxed runner container (every language except JS/TS, which run in the browser). */
export async function runCodeAction(input: { language: string; fileName: string; content: string; stdin?: string }) {
  return runAction(() => runCode(input));
}
