export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (ms <= 0) resolve();
    else window.setTimeout(resolve, ms);
  });
}
