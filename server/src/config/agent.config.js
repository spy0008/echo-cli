import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import { generateObject } from "ai";
import { z } from "zod/v3";
import yoctoSpinner from "yocto-spinner";

const ApplicationSchema = z.object({
  folderName: z.string().describe("Kebab-Case folder name for the application"),
  description: z.string().describe("Brief description of what was created"),
  files: z.array(
    z
      .object({
        path: z.string().describe("Relative file path (e.g src/App.jsx)"),
        content: z.string().describe("Complete File Content"),
      })
      .describe("All files needed for the application"),
  ),
  setupCommands: z.array(
    z
      .string()
      .describe(
        "Bash command to setup and run (e.g: npm install, npm run dev)",
      ),
  ),
  dependencies: z
    .array(
      z.object({
        name: z.string().describe("Package name"),
        version: z.string().describe("Exact version"),
      }),
    )
    .optional()
    .describe("NPM dependencies with versions"),
});

function printSystem(message) {
  console.log(message);
}

function displeyFileTree(files, folderName) {
  printSystem(chalk.yellow("\n Project Structure:"));
  printSystem(chalk.white(`${folderName}/`));

  const filesByDir = {};
  files.forEach((file) => {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";

    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(parts[parts.length - 1]);
  });

  Object.keys(filesByDir)
    .sort()
    .forEach((dir) => {
      if (dir) {
        printSystem(chalk.white(`├── ${dir}/`));
        filesByDir[dir].forEach((file) => {
          printSystem(chalk.white(`|  └── ${file}`));
        });
      } else {
        filesByDir[dir].forEach((file) => {
          printSystem(chalk.white(`├── ${file}`));
        });
      }
    });
}

async function createApplicationFiles(baseDir, folderName, files) {
  const appDir = path.join(baseDir, folderName);

  await fs.mkdir(appDir, { recursive: true });

  printSystem(chalk.yellow(`\n Create directory: ${folderName}/`));

  for (const file of files) {
    const filePath = path.join(appDir, file.path);
    const fileDir = path.dirname(filePath);

    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, file.content, "utf-8");
    printSystem(chalk.green(`✓ ${file.path}`));
  }

  return appDir;
}

export async function generateApplication(
  description,
  aiService,
  cwd = process.cwd(),
) {
  let spinner;
  try {
    printSystem(
      chalk.yellow("\n Agent Mode: Generating your application...\n"),
    );
    printSystem(chalk.gray(`Request: ${description}\n`));
    printSystem(chalk.blue("Agent Response:\n"));

    spinner = yoctoSpinner({
      text: "Generating application with AI...",
    }).start();

    const result = await generateObject({
      model: aiService.model,
      schema: ApplicationSchema,
      prompt: `You are a senior full-stack engineer.

Create a complete, fully functional, production-ready application based on:
${description}

========================
CORE REQUIREMENTS
========================

1. Generate ALL required files and folders so the project runs immediately without missing parts.
2. Include a valid package.json with:
   - All required dependencies
   - Exact and compatible version numbers
   - Correct scripts (dev, build, start, lint, etc.).
3. Include a detailed README.md containing:
   - Project overview
   - Prerequisites
   - Installation steps
   - Environment setup
   - Development & production commands
4. Provide all essential configuration files:
   - .gitignore
   - .env.example
   - tsconfig.json / jsconfig.json (if applicable)
   - ESLint / Prettier configs (if used)
5. Write clean, modular, maintainable, and well-documented code.
6. Implement:
   - Proper error handling
   - Input validation
   - Edge-case handling
   - Secure defaults
7. Ensure:
   - Responsive UI (mobile, tablet, desktop)
   - Cross-browser compatibility
   - Accessibility best practices (ARIA, semantic HTML).
8. Use modern JavaScript / TypeScript best practices:
   - ES2023+ features
   - Type safety
   - Async/await
   - Modular architecture
9. All imports, paths, and references MUST be correct.
10. Do NOT use placeholders, TODOs, mock files, or incomplete code.
    Everything must be fully implemented and runnable.

========================
DELIVERABLES
========================

Provide:

- A meaningful, kebab-case project folder name
- A complete folder structure tree
- Full source code for every file
- Exact setup and run commands:
  (cd, install, build, dev, start, test, etc.)
- A complete dependency list with versions
- Environment variable examples

========================
OUTPUT FORMAT
========================

1. Project Name
2. Folder Structure (tree format)
3. Setup Instructions
4. Source Files (with filenames and full content)
5. Notes (if required)

Generate everything in one coherent, consistent solution.

        `,
    });

    spinner.success("Application generated successfully!");

    const application = result.object;

    printSystem(chalk.green(`\n Generated: ${application.folderName}\n`));
    if (application.dependencies && application.dependencies.length > 0) {
      printSystem(chalk.gray("\nDependencies:"));

      application.dependencies.forEach((dep) => {
        printSystem(`  - ${dep.name}@${dep.version}`);
      });

      printSystem("");
    }

    if (application.files.length === 0) {
      throw new Error("No files were generated");
    }

    displeyFileTree(application.files, application.folderName);

    printSystem(chalk.yellow("\n📄 Creating files...\n"));

    const appDir = await createApplicationFiles(
      cwd,
      application.folderName,
      application.files,
    );

    printSystem(chalk.green.bold("\n✨ Application created successfully!\n"));
    printSystem(chalk.yellow(`📂 Location: ${chalk.bold(appDir)}\n`));

    if (application.setupCommands.length > 0) {
      printSystem(chalk.yellow("📋 Next Steps:\n"));
      printSystem(chalk.white("'''bash"));
      application.setupCommands.forEach((cmd) => {
        printSystem(chalk.white(cmd));
      });

      printSystem(chalk.white("'''\n"));
    }

    return {
      folderName: application.folderName,
      appDir,
      files: application.files.map((f) => f.path),
      commands: application.setupCommands,
      success: true,
    };
  } catch (error) {
    if (spinner) {
      spinner.error("Failed to generate application");
    }
    printSystem(
      chalk.red(`\nError generating application: ${error.message}\n`),
    );
    if (error.stack) {
      printSystem(chalk.dim(error.stack + "\n"));
    }
    throw error;
  }
}
