export const CONNECTOR_CATEGORIES = [
  {
    id: "popular",
    label: "Popular",
    connectors: [
      { id: "confluence", name: "Confluence" },
      { id: "sharepoint", name: "SharePoint" },
      { id: "google-drive", name: "Google Drive" },
      { id: "jira", name: "Jira" },
      { id: "zendesk", name: "Zendesk" },
      { id: "slack", name: "Slack" },
      { id: "salesforce", name: "Salesforce" },
      { id: "hubspot", name: "HubSpot" },
      { id: "gong", name: "Gong" },
      { id: "github", name: "Github" },
      { id: "web", name: "Web" },
      { id: "file", name: "File" },
    ],
  },
  {
    id: "wikis",
    label: "Knowledge Base & Wikis",
    connectors: [
      { id: "notion", name: "Notion" },
      { id: "bookstack", name: "BookStack" },
      { id: "document360", name: "Document360" },
      { id: "discourse", name: "Discourse" },
      { id: "gitbook", name: "GitBook" },
      { id: "slab", name: "Slab" },
      { id: "outline", name: "Outline" },
      { id: "google-sites", name: "Google Sites" },
      { id: "guru", name: "Guru" },
      { id: "mediawiki", name: "MediaWiki" },
      { id: "axero", name: "Axero" },
      { id: "wikipedia", name: "Wikipedia" },
    ],
  },
  {
    id: "cloud",
    label: "Cloud Storage",
    connectors: [
      { id: "dropbox", name: "Dropbox" },
      { id: "s3", name: "S3" },
      { id: "google-storage", name: "Google Storage" },
      { id: "egnyte", name: "Egnyte" },
      { id: "oracle-storage", name: "Oracle Storage" },
      { id: "r2", name: "R2" },
    ],
  },
  {
    id: "ticketing",
    label: "Ticketing & Task Management",
    connectors: [
      { id: "airtable", name: "Airtable" },
      { id: "linear", name: "Linear" },
      { id: "google-desk", name: "Google Desk" },
      { id: "freshdesk", name: "Freshdesk" },
      { id: "asana", name: "Asana" },
      { id: "clickup", name: "ClickUp" },
      { id: "productboard", name: "Productboard" },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    connectors: [
      { id: "gmail", name: "Gmail" },
      { id: "discord", name: "Discord" },
    ],
  },
  {
    id: "code",
    label: "Code Repository",
    connectors: [
      { id: "gitlab", name: "GitLab" },
      { id: "bitbucket", name: "Bitbucket" },
    ],
  },
];

export function getAllConnectors() {
  return CONNECTOR_CATEGORIES.flatMap((cat) =>
    cat.connectors.map((c) => ({ ...c, category: cat.label }))
  );
}

export function getConnectorName(id) {
  return getAllConnectors().find((c) => c.id === id)?.name || id;
}
