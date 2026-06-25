/**
 * Script to generate bcrypt password hashes for test users
 *
 * Usage: node scripts/generate-password-hashes.js
 *
 * This script generates hashes for:
 * - ravi@123
 * - sneha@123
 */

const bcrypt = require("bcryptjs");

async function generateHashes() {
  console.log("Generating bcrypt password hashes...\n");

  const passwords = {
    ravi: "ravi@123",
    sneha: "sneha@123",
  };

  for (const [username, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(
      `SQL: INSERT INTO employees (username, password_hash, name, email) VALUES ('${username}', '${hash}', 'Name Here', '${username}@firmflow.com');`
    );
    console.log("---\n");
  }
}

generateHashes().catch(console.error);
