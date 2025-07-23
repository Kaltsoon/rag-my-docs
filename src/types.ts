export interface RepositoryIdentifier {
  owner: string;
  repo: string;
  ref?: string;
}

export interface DocumentationFile {
  path: string;
  content: string;
}

export interface RepositoryIdentifierWithDocumentation extends RepositoryIdentifier {
  documentationFiles: DocumentationFile[];
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  owner: {
    login: string;
  };
  license: {
    name: string;
  };
}
