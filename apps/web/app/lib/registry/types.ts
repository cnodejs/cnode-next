export interface RegistryVersion {
  name: string;
  version: string;
  description?: string;
  license?: string;
  deprecated?: string;
  keywords?: string[];
  dist?: {
    tarball: string;
    size: number;
    unpackedSize?: number;
    fileCount?: number;
    integrity?: string;
  };
  publish_time?: number | string;
  _cnpmcore_publish_time?: string;
  _npmUser?: { name: string; email?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface RegistryManifest {
  name: string;
  description?: string;
  license?: string;
  keywords?: string[];
  readme?: string;
  homepage?: string;
  repository?: { type?: string; url?: string };
  maintainers?: Array<{ name: string; email?: string }>;
  "dist-tags": Record<string, string>;
  versions: Record<string, RegistryVersion>;
  time?: Record<string, string>;
  _source_registry_name?: string;
}

export interface SearchPackage {
  name: string;
  version: string;
  scope?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  date?: string;
  publisher?: { username: string; email?: string };
  maintainers?: Array<{ username: string; email?: string }>;
}

export interface SearchObject {
  package: SearchPackage;
  score?: { detail?: { popularity?: number } };
  downloads?: { all?: number };
}

export interface SearchResponse {
  objects: SearchObject[];
  total: number;
}

export interface RegistryStats {
  doc_count: number;
  doc_version_count: number;
  download?: {
    today?: number;
    yesterday?: number;
    thisweek?: number;
    thismonth?: number;
    thisyear?: number;
  };
  last_package?: string;
}

export interface DownloadPoint {
  day: string;
  downloads: number;
}

export interface DownloadsResponse {
  downloads: DownloadPoint[];
  versions?: Record<string, DownloadPoint[]>;
  start?: string;
  end?: string;
  package?: string;
}

export interface RegistryFile {
  path: string;
  type: "file" | "directory";
  size?: number;
  lastModified?: string;
  contentType?: string;
  files?: RegistryFile[];
}

export interface RegistryFilesResponse {
  files?: RegistryFile[];
  error?: string;
}
