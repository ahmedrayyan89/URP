import * as icons from "simple-icons";

const SLUG_MAP = {
  confluence: "siConfluence",
  sharepoint: "siSharepoint",
  "google-drive": "siGoogledrive",
  jira: "siJira",
  zendesk: "siZendesk",
  slack: "siSlack",
  salesforce: "siSalesforce",
  hubspot: "siHubspot",
  gong: "siGong",
  github: "siGithub",
  web: null,
  file: null,
  notion: "siNotion",
  bookstack: null,
  document360: null,
  discourse: "siDiscourse",
  gitbook: "siGitbook",
  slab: null,
  outline: null,
  "google-sites": "siGoogle",
  guru: null,
  mediawiki: "siMediawiki",
  axero: null,
  wikipedia: "siWikipedia",
  dropbox: "siDropbox",
  s3: "siAmazonaws",
  "google-storage": "siGooglecloud",
  egnyte: null,
  "oracle-storage": "siOracle",
  r2: "siCloudflare",
  airtable: "siAirtable",
  linear: "siLinear",
  "google-desk": "siGoogle",
  freshdesk: "siFreshdesk",
  asana: "siAsana",
  clickup: "siClickup",
  productboard: null,
  gmail: "siGmail",
  discord: "siDiscord",
  gitlab: "siGitlab",
  bitbucket: "siBitbucket",
};

export default function ConnectorIcon({ connectorId, size = 28 }) {
  const key = SLUG_MAP[connectorId];
  const icon = key ? icons[key] : null;

  if (!icon) {
    const fallback =
      connectorId === "web" ? "🌐" : connectorId === "file" ? "📄" : connectorId.charAt(0).toUpperCase();
    return (
      <span className="connector-icon-fallback" style={{ fontSize: size * 0.55 }}>
        {fallback}
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={`#${icon.hex}`}
      role="img"
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}
