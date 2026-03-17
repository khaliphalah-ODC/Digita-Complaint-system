<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <!-- ─── FOOTER (full-width, replaces AppFooter) ─── -->
    <footer class="site-footer">
      <div class="footer-accent-bar"></div>
      <div class="footer-glow footer-glow-left"></div>
      <div class="footer-glow footer-glow-right"></div>

      <div class="footer-inner">
        <div class="footer-grid">

          <!-- Brand -->
          <div class="footer-col">
            <div class="footer-brand">
              <svg class="brand-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm-6 11h-4v-2h4v2zm0-4H8V7h6v2z"/>
              </svg>
              <span class="brand-name">ComplaintTrack</span>
            </div>
            <p class="brand-desc">A friendly platform that promotes organization Transparency and efficiency by allowing employees, students, and citizens to raise issues clearly and organizations to resolve them fast.</p>
            <div class="social-row">
              <a href="#" class="social-icon" aria-label="Facebook">
                <svg class="si-svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" class="social-icon" aria-label="Twitter">
                <svg class="si-svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" class="social-icon" aria-label="GitHub">
                <svg class="si-svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="footer-col">
            <h4 class="footer-heading">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="#" class="footer-link">Home</a></li>
             <!-- <RouterLink to="/features" class="footer-link">Features</RouterLink>-->
              <li><a href="#features" class="footer-link">Features</a></li>
              <li><a href="#how-it-works" class="footer-link">How It Works</a></li>
              <RouterLink to="/about" class="footer-link">About</RouterLink>
              <!--<li><a href="#" class="footer-link">About</a></li> -->
              <li><a href="#" class="footer-link">Contact</a></li>
            </ul>
          </div>

          <!-- Account -->
          <div class="footer-col">
            <h4 class="footer-heading">Account</h4>
            <ul class="footer-links">
              <li><RouterLink to="/login" class="footer-link">Login</RouterLink></li>
              <li><RouterLink to="/register" class="footer-link">Register</RouterLink></li>
             <!-- <li><RouterLink to="/submit-complaint" class="footer-link">Submit Complaint</RouterLink></li>-->
             <!-- <li><RouterLink to="/track-complaint" class="footer-link">Track Complaint</RouterLink></li>-->
            </ul>
          </div>

          <!-- Support -->
          <div class="footer-col">
            <h4 class="footer-heading">Support</h4>
            <ul class="footer-contact-list">
              <li class="footer-contact-item">
                <div class="contact-icon">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="contact-text"><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="6a191f1a1a05181e2a0905071a060b03041e1e180b090144090507">[email&#160;protected]</a></span>
              </li>
              <li class="footer-contact-item">
                <div class="contact-icon">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <span class="contact-text"><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="d7bfb2bba797b4b8baa7bbb6beb9a3a3a5b6b4bcf9b4b8ba">[email&#160;protected]</a></span>
              </li>
            </ul>
            <div class="newsletter-box">
              <p class="newsletter-title">Get system updates</p>
              <p class="newsletter-sub">Stay informed about new features.</p>
              <div class="newsletter-row">
                <input type="email" placeholder="your@email.com" class="newsletter-input" />
                <button class="newsletter-btn">&#8594;</button>
              </div>
            </div>
          </div>

        </div>

        <div class="footer-bottom">
          <p class="footer-copy">&#169; 2026 ComplaintTrack. All rights reserved.</p>
          <div class="footer-legal">
            <a href="#" class="legal-link">Privacy Policy</a>
            <a href="#" class="legal-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #072f6d 0%, #061a3b 100%);
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.footer-accent-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #072f6d,  #072f6d,  #072f6d,  #072f6d,  #072f6d);
}
.footer-glow {
  position: absolute; border-radius: 50%;
  filter: blur(80px); pointer-events: none;
}
.footer-glow-left  { left: 2rem; top: 2rem; width: 18rem; height: 18rem; background: rgba(249,115,22,0.05); }
.footer-glow-right { right: 2rem; bottom: 2rem; width: 14rem; height: 14rem; background: rgba(56,189,248,0.05); }
.footer-inner {
  position: relative;
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}
@media (min-width: 640px)  { .footer-inner { padding: 0 2.5rem; } }
@media (min-width: 1024px) { .footer-inner { padding: 0 4rem; } }
.footer-grid {
  display: grid; gap: 3rem;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .footer-grid { grid-template-columns: 1.4fr 1fr 1fr 1.2fr; }
}
.footer-col {}
.footer-brand { display: flex; align-items: center; gap: 0.6rem; }
.brand-icon { width: 1.75rem; height: 1.75rem; color: #f97316; }
.brand-name { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em; color: white; }
.brand-desc { margin-top: 1rem; max-width: 18rem; font-size: 0.875rem; line-height: 1.75; color:  #eef1f5; }
.social-row { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.social-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color:  #eef1f5; transition: all 0.2s; text-decoration: none;
}
.social-icon:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.30); color: #f97316; }
.si-svg { width: 1rem; height: 1rem; }
.footer-heading {
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: #eef1f5;
}
.footer-links {
  margin-top: 1.25rem; list-style: none; padding: 0;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.footer-link {
  font-size: 0.875rem; color:  #eef1f5;
  transition: color 0.2s; text-decoration: none; display: block;
}
.footer-link:hover { color: #f97316; }
.footer-contact-list {
  margin-top: 1.25rem; list-style: none; padding: 0;
  display: flex; flex-direction: column; gap: 1rem;
}
.footer-contact-item { display: flex; align-items: center; gap: 0.75rem; }
.contact-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  background: rgba(249,115,22,0.10); color: #f97316; flex-shrink: 0;
}
.contact-text { font-size: 0.875rem; color:  #eef1f5; }
.newsletter-box {
  margin-top: 2rem; border-radius: 1rem;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04); padding: 1rem;
}
.newsletter-title { font-size: 0.75rem; font-weight: 600; color:  #eef1f5; }
.newsletter-sub   { margin-top: 0.25rem; font-size: 0.72rem; color:  #eef1f5; }
.newsletter-row   { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
.newsletter-input {
  flex: 1; min-width: 0; background:  #eef1f5;
  border: 1px solid rgba(255,255,255,0.10); border-radius: 0.5rem;
  padding: 0.45rem 0.75rem; font-size: 0.8rem; color: white; outline: none;
}
.newsletter-input::placeholder { color: #475569; }
.newsletter-btn {
  padding: 0.45rem 0.9rem; border-radius: 0.5rem;
  background: #f97316; color: white; font-weight: 700;
  font-size: 0.9rem; border: none; cursor: pointer; transition: background 0.2s;
}
.newsletter-btn:hover { background: #ea6c0c; }
.footer-bottom {
  margin-top: 3.5rem; padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-between; gap: 1rem;
}
@media (min-width: 640px) { .footer-bottom { flex-direction: row; } }
.footer-copy { font-size: 0.875rem; color: #475569; }
.footer-legal { display: flex; gap: 1.25rem; }
.legal-link { font-size: 0.875rem; color: #475569; text-decoration: none; transition: color 0.2s; }
.legal-link:hover { color: #cbd5e1; }
</style>