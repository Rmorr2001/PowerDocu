import { access } from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'public/engine/worker.js',
  'public/engine/_framework/dotnet.js',
];

try {
  await Promise.all(requiredFiles.map((file) => access(path.resolve(file))));
} catch {
  throw new Error(
    'The generated .NET engine is missing. Run scripts/build-browser.sh from the repository root before producing a static deployment.',
  );
}
