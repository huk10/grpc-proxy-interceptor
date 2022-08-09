import { exec } from "node:child_process";

export function shell(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      if (stderr) reject(error);
      resolve(stdout);
    });
  });
}

export function which(command) {
  return shell(`which ${command}`)
}

export function checkCommandIsExist(command) {
  return which(command).then(() => true).catch(() => false)
}

