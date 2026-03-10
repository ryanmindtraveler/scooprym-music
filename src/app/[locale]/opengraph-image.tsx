import { join } from 'path';
import { readFile } from 'fs/promises';
import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const alt = 'ScoopRYM - Turn absurd news, gossip, and social chaos into AI rap songs';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Generate the image
export default async function Image() {
  // Read the logo file
  let logoSrc: ArrayBuffer | null = null;
  try {
    const logoPath = join(process.cwd(), 'src/assets/og_new.png');
    const logoData = await readFile(logoPath);
    logoSrc = Uint8Array.from(logoData).buffer;
  } catch (e) {
    console.error('Failed to load logo image:', e);
    // Fallback or silence - logoSrc remains null
  }

  // Load a custom font (Inter) for better typography
  // Accessing Google Fonts directly is standard for Next.js OG
  const interSemiBold = await fetch(
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        background: 'linear-gradient(to bottom right, #0F172A, #1E293B)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        {/* Real Logo Image */}
        {logoSrc && (
          <div
            style={{
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            {/* @ts-ignore */}
            <img src={logoSrc} width="120" height="120" style={{ borderRadius: 24 }} alt="ScoopRYM Logo" />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <h1
            style={{
              fontSize: 84,
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, #e2e8f0)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            ScoopRYM
          </h1>
        </div>
      </div>

      <p
        style={{
          fontSize: 32,
          background: 'linear-gradient(to right, #94A3B8, #CBD5E1)',
          backgroundClip: 'text',
          color: 'transparent',
          margin: '20px 0 0 0',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Turn absurd news, gossip, and social chaos into AI rap songs
      </p>

      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: 0.6,
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 50,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 16,
          }}
        >
          AI Rap Songs
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 50,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 16,
          }}
        >
          Absurd News
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 50,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 16,
          }}
        >
          Social Chaos
        </div>
      </div>
    </div>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image size config
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
