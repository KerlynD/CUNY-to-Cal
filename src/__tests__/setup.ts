// Jest setup file for Chrome extension testing

(global as any).chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  downloads: {
    download: jest.fn()
  }
} as any;

(global as any).URL.createObjectURL = jest.fn(() => 'mock-object-url');
(global as any).URL.revokeObjectURL = jest.fn();

(global as any).Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content ? content[0].length : 0,
  type: options?.type || ''
})) as any; 