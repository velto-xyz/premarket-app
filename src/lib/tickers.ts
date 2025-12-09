// Stock-style ticker symbols for all startups
// Format: slug -> ticker symbol (3-5 characters, memorable)

export const startupTickers: Record<string, string> = {
  "aeropulse-mobility": "ARPM",
  "astraflux-engines": "AFLX",
  "autopilot-nexus": "APNX",
  "drivemind-robotics": "DRMR",
  "evofleet-automotive": "EVFL",
  "finorachain": "FNRC",
  "geneweaver-labs": "GNWV",
  "glintmotion-iot": "GMIO",
  "helixdrive-therapeutics": "HLXD",
  "mechaforge-robotics": "MCFG",
  "nebuladrive-spaceworks": "NBDS",
  "orbicore-iot-systems": "ORBI",
  "orbitalnet-relay": "ORNT",
  "pulsebridge-fintech": "PLSB",
  "quantumloop-finance": "QMLP",
  "skyforge-aerospace": "SKFG",
  "synapsehive-robotics": "SNPH",
  "synthharvest-biofoods": "SHBF",
  "terralumen-bioenergy": "TRLM",
  "voltfrost-vehicles": "VLFR",
};

// Get ticker from slug, with fallback generation
export const getTicker = (slug: string): string => {
  if (startupTickers[slug]) {
    return startupTickers[slug];
  }
  // Fallback: generate from slug
  const words = slug.split('-');
  if (words.length === 1) {
    return slug.substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
};

// Get ticker from startup name (for cases where only name is available)
export const getTickerFromName = (name: string): string => {
  // Convert name to slug format and look up
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return getTicker(slug);
};
