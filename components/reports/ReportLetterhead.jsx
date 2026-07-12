// components/reports/ReportLetterhead.jsx

'use client';

import DateConverter from '@remotemerge/nepali-date-converter';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toNepaliNumber = (num) => String(num).replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d)]);

export function ReportHeader({
  institute = {},
  logoUrl,
  reportTitle = 'Report',
  referenceNo,
  date,
  subtitle,
  titleFontSize = 10,
  subtitleFontSize = 7,
  refNoFontSize = 7,
  dateFontSize = 7,
  collegeNameFontSize = 16,
  locationFontSize = 9,
  logoWidth = 150,
  logoHeight = 60,
  useNepaliDate = false, // New prop for Nepali date support
}) {
  const {
    name = 'College Name',
    location = '',
    logo = '/logo.png',
    nameNepali, // Optional Nepali name
    locationNepali, // Optional Nepali location
  } = institute;

  const resolvedLogo = logoUrl || logo;

  // Format date in AD or BS
  const formatDate = () => {
    const d = date ? new Date(date) : new Date();
    
    if (useNepaliDate) {
      try {
        const converter = new DateConverter(d);
        const bs = converter.toBs();
        return `${NEPALI_MONTHS[bs.month - 1]} ${toNepaliNumber(bs.date)}, ${toNepaliNumber(bs.year)}`;
      } catch (error) {
        console.warn('Nepali date conversion failed:', error);
      }
    }
    
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const displayDate = formatDate();

  return (
    <div
      style={{
        borderBottom: '2px solid #0f766e',
        paddingBottom: '4px',
        marginBottom: '4px',
      }}
    >
      {/* Main Header Row - Logo, College Name */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        marginBottom: '2px'
      }}>
        {/* Logo - Left aligned */}
        <div style={{ 
          width: `${logoWidth}px`, 
          height: `${logoHeight}px`, 
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {resolvedLogo && (
            <img
              src={resolvedLogo}
              alt={`${name} logo`}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                maxWidth: `${logoWidth}px`,
                maxHeight: `${logoHeight}px`
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* College Name and Location */}
        <div style={{ 
          flex: 1, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          minHeight: `${logoHeight}px`
        }}>
          <span style={{ 
            fontSize: `${collegeNameFontSize}px`, 
            fontWeight: 700, 
            color: '#0f766e', 
            lineHeight: '1.2'
          }}>
            {name}
          </span>
          {nameNepali && useNepaliDate && (
            <span style={{ 
              fontSize: `${collegeNameFontSize - 2}px`, 
              fontWeight: 600, 
              color: '#0f766e', 
              lineHeight: '1.2'
            }}>
              {nameNepali}
            </span>
          )}
          {location && (
            <span style={{ 
              fontSize: `${locationFontSize}px`, 
              color: '#64748b',
              lineHeight: '1.2'
            }}>
              {location}
              {locationNepali && useNepaliDate && ` | ${locationNepali}`}
            </span>
          )}
        </div>

        {/* Empty space for balance */}
        <div style={{ width: `${logoWidth}px`, flexShrink: 0 }} />
      </div>

      {/* Reference Number and Date Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '4px',
        paddingBottom: '4px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: `${refNoFontSize}px`, color: '#334155', lineHeight: '1.3' }}>
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            {useNepaliDate ? 'सन्दर्भ: ' : 'Ref: '}
          </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            {referenceNo || '..........'}
          </span>
        </div>

        <div style={{ fontSize: `${dateFontSize}px`, color: '#334155', lineHeight: '1.3' }}>
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            {useNepaliDate ? 'मिति: ' : 'Date: '}
          </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            {displayDate}
          </span>
        </div>
      </div>

      {/* Report Title */}
      <div style={{ 
        fontSize: `${titleFontSize}px`, 
        fontWeight: 700, 
        color: '#0f766e', 
        textAlign: 'center',
        marginBottom: '6px',
        paddingBottom: '2px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        lineHeight: '1.2'
      }}>
        {reportTitle}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ 
          fontSize: `${subtitleFontSize}px`, 
          color: '#64748b', 
          marginTop: '4px',
          paddingTop: '4px',
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function ReportFooter({ 
  institute = {}, 
  note,
  footerFontSize = 8,
  footerNameFontSize = 9,
  footerContactFontSize = 7,
  footerNoteFontSize = 6,
  useNepaliDate = false, // New prop for Nepali date support
}) {
  const { 
    name = 'College Name', 
    phone, 
    email, 
    website,
    nameNepali, // Optional Nepali name
  } = institute;

  return (
    <div
      style={{
        borderTop: '2px solid #0f766e',
        paddingTop: '4px',
        marginTop: '4px',
        textAlign: 'center',
        fontSize: `${footerFontSize}px`,
        color: '#64748b',
        pageBreakInside: 'avoid',
        display: 'block',
        width: '100%',
        lineHeight: '1.3'
      }}
    >
      <p style={{ 
        fontWeight: 600, 
        color: '#334155', 
        marginBottom: '2px', 
        fontSize: `${footerNameFontSize}px`,
        lineHeight: '1.2'
      }}>
        {name}
        {nameNepali && useNepaliDate && ` (${nameNepali})`}
      </p>

      {(phone || email || website) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '2px',
            fontSize: `${footerContactFontSize}px`,
          }}
        >
          {phone && <span>📞 {phone}</span>}
          {email && <span>✉️ {email}</span>}
          {website && <span>🌐 {website}</span>}
        </div>
      )}

      {note && (
        <p style={{ 
          fontSize: `${footerNoteFontSize}px`, 
          marginTop: '2px', 
          color: '#94a3b8',
          lineHeight: '1.2'
        }}>
          {note}
        </p>
      )}
    </div>
  );
}