const bcrypt = require("bcryptjs");

(async () => {
  const akshayHash = await bcrypt.hash("akshay@123", 10);
  const kaarthikHash = await bcrypt.hash("kaarthik@123", 10);
  console.log("INSERT INTO employees (name, username, password_hash, classification, specialisation, capacity, on_leave, avatar_color, created_at, updated_at) VALUES");
  console.log(`('Akshay', 'akshay', '${akshayHash}', 'admin', 'Accounting', 100, false, '#3B82F6', NOW(), NOW()),`);
  console.log(`('Kaarthik', 'kaarthik', '${kaarthikHash}', 'manager', 'Accounting', 80, false, '#10B981', NOW(), NOW());`);
})();
