const axios = require("axios");

axios
  .get("https://web-production-737b.up.railway.app/test/view-database")
  .then((r) => {
    const kode = r.data.users.find((u) => u.email === "kodekenobi@gmail.com");
    console.log(
      "kodekenobi@gmail.com in production:",
      kode ? "EXISTS ✅" : "NOT FOUND ❌"
    );

    const admins = r.data.users.filter((u) => u.role === "super_admin");
    console.log("\nSuper admins in production:");
    admins.forEach((a) => console.log(`  - ${a.email} (ID: ${a.id})`));

    if (!kode) {
      console.log("\n⚠️  kodekenobi@gmail.com doesn't exist in production.");
      console.log("   Use one of the existing super admins above.");
    }
  })
  .catch((e) => console.log("Error:", e.message));
