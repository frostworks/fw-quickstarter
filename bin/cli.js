#!/usr/bin/env node
'use strict';

// --- Imports ---
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// --- The Main Function ---
// We wrap our logic in an async function to use await.
async function main() {
  // 1. Welcome Message
  console.log(chalk.blue.bold('Frostworks Quickstart for NodeBB Plugins'));
  console.log('-----------------------------------------');

  // 2. Ask Questions
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
      // Suggest a default ID based on the plugin name
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

  // 3. Setup Paths & Create Directory
  const targetDir = path.resolve(process.cwd(), pluginId);
  const templateDir = path.resolve(__dirname, '..', 'templates', 'plugin');

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Error: Directory "${pluginId}" already exists.`));
    process.exit(1);
  }

  console.log(chalk.yellow(`\nCreating new plugin in: ${targetDir}`));
  fs.mkdirSync(targetDir);

  // 4. Copy Template Files
  await fs.copy(templateDir, targetDir);

  // 5. Customize Files
  // --- Customize plugin.json ---
  const pluginJsonPath = path.join(targetDir, 'plugin.json');
  const pluginJson = await fs.readJson(pluginJsonPath);

  pluginJson.id = pluginId;
  pluginJson.name = pluginName;
  pluginJson.description = description;
  // A good practice is to add an author field
  pluginJson.author = author; 

  await fs.writeJson(pluginJsonPath, pluginJson, { spaces: 2 });

  // --- Customize library.js ---
  const libraryPath = path.join(targetDir, 'library.js');
  let libraryContent = await fs.readFile(libraryPath, 'utf8');

  // Replace the placeholder plugin ID in the admin route
  libraryContent = libraryContent.replace(
    '/admin/plugins/quickstart', 
    `/admin/plugins/${pluginId}`
  );
  libraryContent = libraryContent.replace(
    'Quickstart',
    pluginName
  );

  await fs.writeFile(libraryPath, libraryContent, 'utf8');

  // 6. Final Instructions
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