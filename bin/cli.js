#!/usr/bin/env node
'use strict';

// --- Imports ---
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// --- Helper Function to find all files recursively ---
async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

// --- The Main Function ---
async function main() {
  // 1. Welcome Message
  console.log(chalk.blue.bold('Frostworks Quickstart for NodeBB Plugins'));
  console.log('-----------------------------------------');

  // 2. Ask Questions (Unchanged)
  const questions = [
    {
      type: 'input',
      name: 'pluginName',
      message: 'What is your plugin\'s name? (e.g., My Awesome Plugin)',
      validate: input => !!input || 'Plugin name cannot be empty.',
    },
    {
      type: 'input',
      name: 'pluginId',
      message: 'What is your plugin\'s ID?',
      default: (answers) => `nodebb-plugin-${answers.pluginName.toLowerCase().replace(/\s+/g, '-')}`,
      validate: input => !!input || 'Plugin ID cannot be empty.',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Enter a short description:',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Who is the author?',
    },
  ];
  const answers = await inquirer.prompt(questions);
  const { pluginName, pluginId, description, author } = answers;

  // 3. Setup Paths & Create Directory (Unchanged)
  const targetDir = path.resolve(process.cwd(), pluginId);
  const templateDir = path.resolve(__dirname, '..', 'templates', 'plugin');

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Error: Directory "${pluginId}" already exists.`));
    process.exit(1);
  }

  console.log(chalk.yellow(`\nCreating new plugin in: ${targetDir}`));
  fs.mkdirSync(targetDir);

  // 4. Copy Template Files (Unchanged)
  await fs.copy(templateDir, targetDir);

  // 5. --- NEW: Powerful Find & Replace ---
  console.log(chalk.yellow('Customizing template files...'));

  // Define all the tokens we need to replace
  const replacements = [
    { find: /nodebb-plugin-quickstart/g, replace: pluginId },
    { find: /Quickstart/g, replace: pluginName },
    { find: /A NodeBB plugin built from the quickstart template\./g, replace: description },
    // You could add more here if needed, e.g., for author
  ];

  // Get a list of all files in the new directory
  const filesToModify = await getFiles(targetDir);
  const textFileExtensions = ['.js', '.json', '.tpl', '.less', '.md', '.css', '.html'];

  for (const filePath of filesToModify) {
    // Only process text files
    if (textFileExtensions.includes(path.extname(filePath))) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Apply all replacements to the file content
        for (const { find, replace } of replacements) {
          content = content.replace(find, replace);
        }

        // Specifically update the author in package.json if it exists
        if (path.basename(filePath) === 'package.json') {
          const pkg = JSON.parse(content);
          pkg.author = author;
          content = JSON.stringify(pkg, null, 2);
        }

        await fs.writeFile(filePath, content, 'utf8');
      } catch (err) {
        console.warn(chalk.yellow(`Could not process file ${filePath}: ${err.message}`));
      }
    }
  }
  
  // 6. Final Instructions (Unchanged)
  console.log(chalk.green.bold('\nSuccess! Your new NodeBB plugin is ready.'));
  console.log('-----------------------------------------');
  console.log(`To get started, run the following commands:\n`);
  console.log(chalk.cyan(`  cd ${pluginId}`));
  console.log(chalk.cyan(`  npm install`));
  console.log(chalk.cyan(`  # Link it to your NodeBB dev environment if needed`));
}

// --- Run the main function and handle errors ---
main().catch(error => {
  console.error(chalk.red('\nAn unexpected error occurred:'));
  console.error(error);
  process.exit(1);
});