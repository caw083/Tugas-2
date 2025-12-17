import "./about.css"
export default class AboutPage {
  constructor() {
    this.data = null;
  }

  async render() {
    return `
    <section class="about-container">
      <div class="about-header">
        <h1 class="about-title">About</h1>
        <p class="about-subtitle">Tentang aplikasi ini</p>
      </div>

      <div class="about-content">
        <p>
          Aplikasi ini merupakan <strong>Single Page Application (SPA)</strong> 
          yang dirancang untuk menampilkan data lokasi secara interaktif di peta digital 
          serta memungkinkan pengguna menambahkan data baru secara langsung ke dalam sistem. 
          Navigasi antar halaman berjalan mulus tanpa reload berkat penerapan hash routing 
          dan efek transisi halaman.
        </p>
        <p>
          Data diperoleh dari <strong>API eksternal</strong> dan ditampilkan dalam bentuk daftar 
          berisi gambar dan deskripsi teks. Setiap data divisualisasikan di peta dengan marker 
          dan popup informasi. Peta juga mendukung interaksi seperti filter lokasi 
          dan sinkronisasi antara daftar dan marker.
        </p>
        <p>
          Aplikasi menyediakan fitur <strong>tambah data baru</strong> melalui form yang 
          dilengkapi upload gambar, pemilihan koordinat lewat klik pada peta, serta validasi input. 
          Pesan sukses atau error ditampilkan untuk meningkatkan pengalaman pengguna.
        </p>
        <p>
          Dari sisi <strong>aksesibilitas</strong>, aplikasi menggunakan elemen HTML semantik, 
          teks alternatif pada gambar, label di setiap input, serta desain responsif 
          untuk perangkat mobile, tablet, dan desktop. Aplikasi ini juga dapat diakses 
          melalui keyboard dan memiliki fitur skip to content.
        </p>
      </div>
    </section>

    `;
  }

  async afterRender() {
    // Untuk halaman statis about, kemungkinan tidak perlu interaksi
  }
}
