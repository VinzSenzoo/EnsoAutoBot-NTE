const axios = require('axios');

async function createDeFiProject(slug, data, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(`https://api.defidex.com/projects/${slug}`, data);
      console.log(`Proyek ${slug} berhasil dibuat.`);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log(`Proyek ${slug} tidak ditemukan. Lewati.`);
          return null;
        } else {
          console.log(`Gagal membuat proyek ${slug} (Percobaan ke-${attempt}): ${error.response.status}`);
        }
      } else {
        console.log(`Kesalahan jaringan saat membuat proyek ${slug} (Percobaan ke-${attempt}): ${error.message}`);
      }
      if (attempt === retries) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000)); // delay 1 detik sebelum retry
    }
  }
}

module.exports = { createDeFiProject };
