import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const HeroCanvas = dynamic(() => import('../components/HeroCanvas'), { ssr: false });

const PROJECTS = [
  {
    title: 'Vedion Screen Share',
    description: 'Windows desktop app for hotkey-triggered screen capture with AI analysis and Discord delivery.',
    tags: ['C#', 'WPF', '.NET 8', 'Firebase'],
    year: 2026,
    link: '/shop',
    image: '/assets/gen/project_screen_share.png',
  },
  {
    title: 'vedion.cloud',
    description: 'Personal portfolio and product platform built with Next.js, Firebase, and Three.js.',
    tags: ['Next.js', 'Three.js', 'Firebase'],
    year: 2025,
    link: '#',
    image: '/assets/gen/project_portfolio.png',
  },
  {
    title: 'Data Analysis Projects',
    description: 'Statistical modeling and visualization using Python, pandas, and scikit-learn.',
    tags: ['Python', 'pandas', 'scikit-learn'],
    year: 2025,
    link: '#',
    image: '/assets/gen/project_ai.png',
  },
  {
    title: 'Interactive Learning',
    description: 'Course modules for STAT 240 with code windows and AI-powered quiz explanations.',
    tags: ['R', 'Statistics', 'Education'],
    year: 2025,
    link: '/learn',
    image: '/assets/gen/project_learn.png',
  },
];

const SKILLS = {
  languages: [
    { name: 'Python', width: '85%' },
    { name: 'R', width: '88%' },
    { name: 'JavaScript', width: '80%' },
    { name: 'SQL', width: '75%' },
  ],
  frameworks: [
    { name: 'React', width: '82%' },
    { name: 'Next.js', width: '80%' },
    { name: 'Node.js', width: '78%' },
    { name: 'Firebase', width: '85%' },
    { name: 'Three.js', width: '75%' },
    { name: 'pandas', width: '88%' },
  ],
};

const SOCIALS = [
  { label: 'GitHub', url: 'https://github.com/LuminsWorld' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/austintessmer' },
  { label: 'Twitter', url: 'https://twitter.com' },
];

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);

  // Track scroll for nav blur effect
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reveal animations on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal, .stagger').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Skill bar animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-bar-fill').forEach((bar) => {
              bar.style.width = bar.dataset.width || '0%';
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.skills-section').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Austin Tessmer | Data Science & Design</title>
        <meta name="description" content="Austin Tessmer - Data Science student at UW-Madison. Building at the intersection of data, code, and design." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grain" />

      {/* NAV */}
      <nav className={navScrolled ? 'scrolled' : ''}>
        <span className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          HOME
        </span>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/shop">SHOP</a>
          <a href="/learn">LEARN</a>
          <a href="#work">WORK</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          height: '100vh',
          minHeight: '580px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingLeft: 'clamp(1.25rem, 6vw, 4rem)',
          paddingRight: 'clamp(1.25rem, 6vw, 4rem)',
          paddingTop: '80px',
          overflow: 'hidden',
        }}
        className="scanlines"
      >
        <HeroCanvas />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', width: '100%' }}>
          <div className="section-label" style={{ marginBottom: '1.25rem' }}>
            DATA SCIENCE STUDENT
          </div>

          <h1 className="hero-text" style={{ marginBottom: '1.5rem' }}>
            Austin<br />
            <span className="highlight-green">Tessmer</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
            Data Science student at UW-Madison. Building at the intersection of <span className="highlight-green">data</span>, code, and design.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <button className="btn-primary" onClick={() => {
              document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
            }}>
              VIEW WORK
            </button>
            <a
              className="cta"
              href="https://vedion.cloud"
              target="_blank"
              rel="noopener noreferrer"
            >
              VEDION.CLOUD &rarr;
            </a>
          </div>

          <div className="scroll-indicator">SCROLL</div>
        </div>
      </section>

      {/* WORK SECTION */}
      <section
        id="work"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label reveal" style={{ marginBottom: '1rem' }}>
            SELECTED WORK
          </div>

          <h2 className="reveal" style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            marginBottom: '3rem',
            letterSpacing: '-0.03em',
            color: 'var(--text)',
          }}>
            Projects
          </h2>

          <div className="stagger" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {PROJECTS.map((project, index) => (
              <a
                key={index}
                href={project.link}
                className="project-card"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--green)',
                  letterSpacing: '0.2em',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{
                  marginTop: '1rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                }}>
                  {project.year}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS SECTION */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
        className="skills-section"
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label reveal" style={{ marginBottom: '1rem' }}>
            SKILLS
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
          }}>
            {/* Languages */}
            <div className="reveal">
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--text)',
              }}>
                Languages
              </h3>
              {SKILLS.languages.map((skill) => (
                <div key={skill.name} className="skill-bar-container">
                  <div className="skill-bar-label">
                    <span>{skill.name}</span>
                  </div>
                  <div className="skill-bar-track">
                    <div
                      className="skill-bar-fill"
                      data-width={skill.width}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Frameworks & Tools */}
            <div className="reveal">
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--text)',
              }}>
                Frameworks & Tools
              </h3>
              {SKILLS.frameworks.map((skill) => (
                <div key={skill.name} className="skill-bar-container">
                  <div className="skill-bar-label">
                    <span>{skill.name}</span>
                  </div>
                  <div className="skill-bar-track">
                    <div
                      className="skill-bar-fill"
                      data-width={skill.width}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        id="about"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section-label reveal" style={{ marginBottom: '1rem' }}>
            ABOUT
          </div>

          <h2 className="reveal" style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            marginBottom: '2rem',
            letterSpacing: '-0.03em',
            color: 'var(--text)',
          }}>
            Who I Am
          </h2>

          <p className="reveal" style={{
            fontSize: '1rem',
            lineHeight: 1.8,
            color: 'var(--text-dim)',
            marginBottom: '1.5rem',
          }}>
            Data Science student at UW-Madison. I build things at the intersection of data, code, and design. When I'm not writing Python or R, I'm exploring new technologies and creating tools that solve real problems.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            {SOCIALS.map(({ label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="cta"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section
        id="contact"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)',
          textAlign: 'center',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="reveal">
          <div className="section-label" style={{ marginBottom: '1rem' }}>
            GET IN TOUCH
          </div>

          <a href="mailto:austintessmer06@gmail.com" className="contact-email">
            austintessmer06@gmail.com
          </a>

          <p style={{
            marginTop: '1.5rem',
            fontSize: '1rem',
            color: 'var(--text-dim)',
            lineHeight: 1.7,
          }}>
            Open to opportunities, collaborations, and interesting problems.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 2,
        padding: '1.5rem clamp(1.25rem, 5vw, 2rem)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
        }}>
          VEDION © 2026
        </div>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
        }}>
          {SOCIALS.map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--green)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>

    </>
  );
}
