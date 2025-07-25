export interface RepositoryIdentifier {
  owner: string;
  repo: string;
  ref?: string;
}

export interface RepositoryIdentifierWithAuth extends RepositoryIdentifier {
  auth?: string
}

export interface DocumentationFile {
  path: string;
  content: string;
}