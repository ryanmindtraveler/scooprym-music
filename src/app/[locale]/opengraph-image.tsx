import { headers } from 'next/headers';
import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const alt = 'ScoopRYM - Turn headlines, drama, and gossip into AI parody songs';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Generate the image
export default async function Image() {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'https';
  const siteUrl = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_WEB_URL || 'https://www.scooprym.app';
  const logoSrc = `${siteUrl}/logo.png`;

  // Load a custom font (Inter) for better typography
  // Accessing Google Fonts directly is standard for Next.js OG
  const interSemiBold = await fetch(
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        background: '#0F172A',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic Background Blobs */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          left: -150,
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          right: -100,
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '0 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 32,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* @ts-ignore */}
            <img src={logoSrc} width="100" height="100" style={{ borderRadius: 16 }} alt="ScoopRYM Logo" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontSize: 110,
                fontWeight: 800,
                background: 'linear-gradient(to bottom right, #FFFFFF 30%, #94A3B8)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
              }}
            >
              ScoopRYM
            </h1>
          </div>
        </div>

        <p
          style={{
            fontSize: 42,
            lineHeight: 1.2,
            color: '#E2E8F0',
            maxWidth: 800,
            textAlign: 'center',
            fontWeight: 500,
            margin: '0 0 48px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Turn headlines, drama, and gossip into{' '}
          <span style={{ color: '#818CF8', fontWeight: 600 }}>AI parody songs</span>
        </p>

        {/* Decorative Soundwave Elements */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 40, opacity: 0.4 }}>
          {[20, 40, 25, 35, 15, 30, 45, 25, 35, 20, 40, 30, 15].map((h, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: h,
                background: 'linear-gradient(to top, #6366F1, #EC4899)',
                borderRadius: 3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer / Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            borderRadius: 100,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94A3B8',
            fontSize: 18,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Music Identity Protocol
        </div>
      </div>
    </div>,
    // ImageResponse options
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interSemiBold,
          style: 'normal',
          weight: 600,
        },
      ],
    }
  );
}
