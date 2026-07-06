import { useState } from 'react';

export default function MarketingPage({
  onLaunchDemo,
  onOpenScript,
  onOpenSpec,
  onRunPresenter,
  onExportFeedback,
  feedbackCount = 0,
  presenterRunning = false
}) {
  // Mini interactive playground states inside the landing page
  const [padding, setPadding] = useState(32);
  const [radius, setRadius] = useState(12);
  const [btnText, setBtnText] = useState('Start free trial');
  const [btnColor, setBtnColor] = useState('#1E40AF');

  // Computed TSX output code representing the changes
  const generatedCode = `export function PricingCard() {
  return (
    <div 
      style={{ padding: ${padding}, borderRadius: ${radius} }}
      className="bg-white shadow-xl border"
    >
      <h3>"STUDIO"</h3>
      <button style={{ background: '${btnColor}' }}>
        ${btnText}
      </button>
    </div>
  );
}`;

  return (
    <div 
      style={{
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        overflowY: 'visible',
        position: 'relative'
      }}
    >
      {/* Background radial glowing decorations */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(219, 39, 119, 0.08) 0%, transparent 75%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* MARKETING HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 64px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        position: 'sticky',
        top: 0,
        background: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.25rem' }}>
          <div className="logo-icon" style={{ width: 28, height: 28 }}>
            <div className="logo-dot" style={{ width: 10, height: 10 }}></div>
          </div>
          <span>BluePainter <span style={{ fontWeight: 400, opacity: 0.8 }}>Studio</span></span>
        </div>
        <nav style={{ display: 'flex', gap: 32, fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>
          <a href="#strategy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#94a3b8'}>Strategy</a>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#94a3b8'}>Features</a>
          <a href="#demo" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#94a3b8'}>Interactive Sandbox</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#94a3b8'}>Pricing</a>
        </nav>
        <div>
          <button 
            style={{
              background: 'linear-gradient(135deg, var(--blue-primary), var(--pink-primary))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.2s'
            }}
            onClick={() => onLaunchDemo('phase1')}
            onMouseOver={e=>e.target.style.transform='scale(1.05)'}
            onMouseOut={e=>e.target.style.transform='none'}
          >
            Launch Free Sandbox
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        padding: '80px 64px 60px 64px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          color: '#60a5fa',
          padding: '6px 14px',
          borderRadius: '50px',
          fontSize: '0.75rem',
          fontWeight: 600,
          marginBottom: '28px',
          letterSpacing: '0.05em'
        }}>
          <span>✨</span> Workflow moat, not an LLM wrapper
        </div>
        
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '3.75rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          marginBottom: '24px',
          color: '#ffffff'
        }}>
          The <span style={{
            background: 'linear-gradient(to right, #3b82f6, #db2777)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Dreamweaver moment</span> Figma never delivered.
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: '40px',
          maxWidth: '750px',
          margin: '0 auto 40px auto'
        }}>
          BluePainter preserves <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>AST round-trips</strong> and <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>team design policy</strong> inside your repo — with a learning loop that compounds from every fix, dismiss, and merge.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button 
            style={{
              background: 'linear-gradient(135deg, var(--blue-primary), var(--pink-primary))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 28px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.2s'
            }}
            onClick={() => onLaunchDemo('phase1', true)}
            onMouseOver={e=>e.target.style.transform='scale(1.05)'}
            onMouseOut={e=>e.target.style.transform='none'}
          >
            Start Guided Demo
          </button>
          
          <button 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '14px 28px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              const el = document.getElementById('demo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onMouseOver={e=>{e.target.style.background='rgba(255,255,255,0.06)'; e.target.style.borderColor='rgba(255,255,255,0.2)'}}
            onMouseOut={e=>{e.target.style.background='rgba(255,255,255,0.03)'; e.target.style.borderColor='rgba(255,255,255,0.1)'}}
          >
            Try Mini Playground ↓
          </button>
        </div>
      </section>

      {/* STRATEGY — moat & bear case */}
      <section id="strategy" style={{
        padding: '60px 64px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
            Built to survive the two clocks
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Models get cheaper. Incumbents ship fast. Our moat is the learning loop — fixes, dismissals, and team policy that improve with every session.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { title: 'Learning loop moat', desc: 'Receipt fixes, dismissals, and policy changes log locally (production: per team). Product gets better with usage — not with the next GPT release.', color: '#2563eb' },
            { title: 'Bear case test', desc: 'If Figma + Cursor ship this in 90 days, we still win on repo round-trip + team policy. If the answer is "nicer UI," we don\'t build it.', color: '#db2777' },
            { title: 'v1 = Phase 1 only', desc: 'Ship VS Code / Cursor extension with real Recast sync. Phases 2–4 are vision demos — explicitly deferred.', color: '#7c3aed' }
          ].map((card) => (
            <div key={card.title} style={{
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, marginBottom: 12 }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button type="button" onClick={onOpenSpec} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1',
            padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
          }}>
            📄 Read full product spec
          </button>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" style={{
        padding: '80px 64px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '12px' }}>
            Why BluePainter is defensible
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Not a generator — a repo-native workflow with compounding team policy.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
          {/* Card 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s'
          }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
            <div style={{ width: 40, height: 40, background: 'rgba(37, 99, 235, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justify: 'center', marginBottom: 16 }}>
              <svg style={{ width: 24, height: 24, color: 'var(--blue-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.76" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>AST-Preserving Sync</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Canvas ↔ code round-trip in your repo. v1 targets Recast/Babel — formatting and comments survive visual edits. (Prototype uses regex; see spec.)
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s'
          }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
            <div style={{ width: 40, height: 40, background: 'rgba(219, 39, 119, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justify: 'center', marginBottom: 16 }}>
              <svg style={{ width: 24, height: 24, color: 'var(--pink-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>Team Policy Receipts</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Configurable governance: contrast floor, spacing grid, CTA blocklist, feature limits. Fix, dismiss, or customize — every action feeds the learning loop.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s'
          }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
            <div style={{ width: 40, height: 40, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justify: 'center', marginBottom: 16 }}>
              <svg style={{ width: 24, height: 24, color: 'var(--purple-figma)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>IDE-First Distribution</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              v1 ships where developers live: VS Code / Cursor extension reading/writing src/. Vision surfaces (Figma, Tauri, responsive) follow if validation passes.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MINI DEMO PLAYGROUND */}
      <section id="demo" style={{
        padding: '60px 64px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', alignItems: 'center' }}>
            
            {/* Visual interactive control card (simulated canvas element) */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--pink-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interactive Sandbox</span>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800, margin: '8px 0 20px 0', color: '#ffffff', lineHeight: 1.2 }}>
                Test the Bidirectional Engine Live
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
                Adjust the visual sliders below. Notice how the card shape transforms immediately, and see the compiler update the generated React TSX file in real-time.
              </p>

              {/* Sliders container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Card Padding</span>
                    <span className="value">{padding}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="16" 
                    max="64" 
                    value={padding} 
                    onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                    className="range-input padding-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>Border Corner Radius</span>
                    <span className="value">{radius}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="28" 
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                    className="range-input radius-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>CTA Button text</span>
                  </div>
                  <input 
                    type="text"
                    value={btnText}
                    onChange={(e) => setBtnText(e.target.value)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button 
                    onClick={() => { setBtnColor('#cbd5e1'); }} // low contrast light grey
                    style={{ padding: '6px 12px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.1)', background: '#cbd5e1', color: '#111', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Fails Contrast
                  </button>
                  <button 
                    onClick={() => { setBtnColor('#1E40AF'); }} // high contrast dark blue
                    style={{ padding: '6px 12px', borderRadius: 4, fontSize: '0.7rem', border: 'none', background: '#1E40AF', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Passes Contrast
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Code display card */}
            <div style={{
              background: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              {/* Card visual representation render */}
              <div style={{
                background: '#ffffff',
                color: '#1e293b',
                padding: `${padding}px`,
                borderRadius: `${radius}px`,
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginBottom: '20px',
                width: '100%',
                maxWidth: '280px',
                margin: '0 auto 20px auto',
                transition: 'all 0.1s'
              }}>
                <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  STUDIO
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  $29<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/month</span>
                </div>
                <button style={{ 
                  width: '100%', 
                  background: btnColor, 
                  color: btnColor === '#cbd5e1' ? '#111' : '#ffffff', 
                  border: 'none', 
                  padding: 8, 
                  borderRadius: 6, 
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}>
                  {btnText}
                </button>
              </div>

              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                lineHeight: 1.4,
                overflowX: 'auto',
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.03)'
              }}>
                {generatedCode}
              </pre>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={() => onLaunchDemo('phase1', true)}
              style={{
                background: 'linear-gradient(135deg, var(--blue-primary), var(--pink-primary))',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              Open Full Interactive Demo →
            </button>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 12 }}>
              Canvas, code editor, design receipts, and four platform views — fully clickable.
            </p>
          </div>
        </div>
      </section>
      <section style={{
        padding: '60px 64px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800 }}>
            Four Form Factors — vision after v1
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Phase 1 is the v1 build target. Phases 2–4 demonstrate long-term surface area if validation succeeds.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {/* Phase 1 card */}
          <div 
            onClick={() => onLaunchDemo('phase1')}
            style={{
              background: 'rgba(30, 41, 59, 0.2)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--blue-primary)'; e.currentTarget.style.background='rgba(37, 99, 235, 0.04)'}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; e.currentTarget.style.background='rgba(30, 41, 59, 0.2)'}}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>Phase 1</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>VS Code / Cursor <span style={{ fontSize: '0.6rem', background: '#2563eb', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>v1</span></div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', lineHeight: 1.4 }}>IDE Webview canvas renders component side-by-side with Editor.</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--blue-primary)', fontWeight: 700, marginTop: 12, display: 'block' }}>Launch Phase 1 →</span>
          </div>

          {/* Phase 2 card */}
          <div 
            onClick={() => onLaunchDemo('phase2')}
            style={{
              background: 'rgba(30, 41, 59, 0.2)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--blue-primary)'; e.currentTarget.style.background='rgba(37, 99, 235, 0.04)'}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; e.currentTarget.style.background='rgba(30, 41, 59, 0.2)'}}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>Phase 2</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Tauri Desktop App</div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', lineHeight: 1.4 }}>Standalone desktop workspace with components library browser.</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--blue-primary)', fontWeight: 700, marginTop: 12, display: 'block' }}>Launch Phase 2 →</span>
          </div>

          {/* Phase 3 card */}
          <div 
            onClick={() => onLaunchDemo('phase3')}
            style={{
              background: 'rgba(30, 41, 59, 0.2)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--purple-figma)'; e.currentTarget.style.background='rgba(124, 58, 237, 0.04)'}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; e.currentTarget.style.background='rgba(30, 41, 59, 0.2)'}}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>Phase 3</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Figma Plugin</div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', lineHeight: 1.4 }}>Generate React TSX and keep elements in sync right inside Figma.</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--purple-figma)', fontWeight: 700, marginTop: 12, display: 'block' }}>Launch Phase 3 →</span>
          </div>

          {/* Phase 4 card */}
          <div 
            onClick={() => onLaunchDemo('phase4')}
            style={{
              background: 'rgba(30, 41, 59, 0.2)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--pink-primary)'; e.currentTarget.style.background='rgba(219, 39, 119, 0.04)'}}
            onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; e.currentTarget.style.background='rgba(30, 41, 59, 0.2)'}}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>Phase 4</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Responsive Canvas</div>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8', lineHeight: 1.4 }}>Test mobile, tablet, and web viewports stacked side-by-side.</p>
            <span style={{ fontSize: '0.65rem', color: 'var(--pink-primary)', fontWeight: 700, marginTop: 12, display: 'block' }}>Launch Phase 4 →</span>
          </div>
        </div>
      </section>

      {/* PRICING PLANS COMPLIANT TABLE */}
      <section id="pricing" style={{
        padding: '60px 64px 100px 64px',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 800 }}>Pricing Plans</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Flexible tiers for developer freelancers and premium design agencies.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* Plan Pro */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.8))',
            border: '2px solid var(--blue-primary)',
            borderRadius: '20px',
            padding: '40px',
            position: 'relative'
          }}>
            <span style={{ position: 'absolute', top: -12, right: 24, background: 'var(--blue-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>POPULAR</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue-primary)', marginBottom: 8 }}>STUDIO PRO</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-title)' }}>$29</span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: 4 }}>/month</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 24, lineHeight: 1.4 }}>Complete bidirectional visual-code sync workspace suite.</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 32 }}>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> Unlimited SaaS/app components</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> Full design receipts (Contrast, Grid, Copy)</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> All 4 workspace platforms (VS Code, Tauri, Figma, Web)</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> Custom theme styles exports</li>
            </ul>
            <button 
              onClick={() => onLaunchDemo('phase1')}
              style={{ width: '100%', background: 'var(--blue-primary)', border: 'none', padding: 12, borderRadius: 8, color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              Get Started with Pro
            </button>
          </div>

          {/* Plan Enterprise */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 8 }}>ENTERPRISE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-title)' }}>Custom</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 24, lineHeight: 1.4 }}>Custom integrations, self-hosting, and advanced team features.</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 32 }}>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> Everything in Pro tier</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> Dedicated self-hosted language server</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> SSO & Custom RBAC controls</li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--success-color)' }}>✓</span> 24/7 dedicated support engineer SLAs</li>
            </ul>
            <button 
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Contact Enterprise Sales
            </button>
          </div>

        </div>
      </section>

      {/* FACILITATOR TOOLBAR — for people running validation sessions */}
      <section className="facilitator-section">
        <div className="facilitator-inner">
          <div>
            <span className="facilitator-label">Running a demo session?</span>
            <h2 className="facilitator-title">Presenter toolkit</h2>
            <p className="facilitator-desc">
              Use these tools while interviewing designers and developers. Feedback saves locally in this browser — export JSON after your sessions.
            </p>
          </div>
          <div className="facilitator-actions">
            <button type="button" className="facilitator-btn facilitator-btn-primary" onClick={onRunPresenter} disabled={presenterRunning}>
              {presenterRunning ? '▶ Presenting…' : '▶ Auto Present'}
            </button>
            <button type="button" className="facilitator-btn" onClick={() => onLaunchDemo('phase1')}>
              Open Sandbox
            </button>
            <button type="button" className="facilitator-btn" onClick={onOpenScript}>
              📋 Interview Script
            </button>
            <button type="button" className="facilitator-btn" onClick={onOpenSpec}>
              📄 Product Spec
            </button>
            <button type="button" className="facilitator-btn" onClick={onExportFeedback}>
              ⬇ Export Feedback{feedbackCount > 0 ? ` (${feedbackCount})` : ''}
            </button>
          </div>
        </div>
      </section>

      {/* NOT BUILDING */}
      <section id="not-building" style={{
        padding: '0 64px 48px',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          border: '1px dashed rgba(239, 68, 68, 0.25)',
          borderRadius: 12,
          padding: '24px 28px',
          background: 'rgba(239, 68, 68, 0.04)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5', marginBottom: 12 }}>
            Explicitly NOT building (v1)
          </h3>
          <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
            {['AI whole-app generator', 'Figma replacement', 'Website builder', 'Four platforms in v1', 'Hosted proprietary runtime', 'Features with no incumbent defense'].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#ef4444' }}>✕</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '48px 64px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#070a13',
        fontSize: '0.8rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'white' }}>
          <div className="logo-icon" style={{ width: 16, height: 16 }}><div className="logo-dot" style={{ width: 6, height: 6 }}></div></div>
          <span>BluePainter</span>
        </div>
        <div>
          <span>© 2026 BluePainter Studio. All rights reserved. Built with AST bidirectional sync.</span>
        </div>
      </footer>

    </div>
  );
}
