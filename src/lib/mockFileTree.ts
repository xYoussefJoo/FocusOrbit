export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

export const dotnetArchitecture: FileNode[] = [
  {
    id: 'domain',
    name: 'Vesper.Domain',
    type: 'folder',
    children: [
      { id: 'entities', name: 'Entities', type: 'folder', children: [
        { id: 'session', name: 'Session.cs', type: 'file' },
        { id: 'user', name: 'User.cs', type: 'file' }
      ]},
      { id: 'common', name: 'Common', type: 'folder' }
    ]
  },
  {
    id: 'application',
    name: 'Vesper.Application',
    type: 'folder',
    children: [
      { id: 'interfaces', name: 'Interfaces', type: 'folder', children: [
        { id: 'irepository', name: 'IRepository.cs', type: 'file' },
        { id: 'isession', name: 'ISessionService.cs', type: 'file' }
      ]},
      { id: 'services', name: 'Services', type: 'folder', children: [
        { id: 'productivity', name: 'ProductivityService.cs', type: 'file' }
      ]}
    ]
  },
  {
    id: 'infrastructure',
    name: 'Vesper.Infrastructure',
    type: 'folder',
    children: [
      { id: 'data', name: 'Data', type: 'folder' },
      { id: 'identity', name: 'Identity', type: 'folder' }
    ]
  },
  {
    id: 'api',
    name: 'Vesper.API',
    type: 'folder',
    children: [
      { id: 'controllers', name: 'Controllers', type: 'folder' },
      { id: 'program', name: 'Program.cs', type: 'file' }
    ]
  }
];
