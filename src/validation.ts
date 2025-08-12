import { DirTree, DirNode } from './types';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a directory tree structure according to DirNav requirements
 * @param tree The directory tree to validate
 * @param currentPath Current path for error reporting (used internally for recursion)
 * @returns ValidationResult containing validation status and any errors found
 */
export function validateDirectoryTree(tree: DirTree, currentPath: string = ''): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check if tree is null or undefined
  if (!tree || typeof tree !== 'object') {
    errors.push({
      path: currentPath || 'root',
      message: 'Directory tree must be a valid object'
    });
    return { isValid: false, errors };
  }

  // Get all entries in the current directory
  const entries = Object.entries(tree);
  
  // Validate 23-item limit per directory (Requirement 8.2)
  if (entries.length > 23) {
    errors.push({
      path: currentPath || 'root',
      message: `Directory contains ${entries.length} items, but maximum allowed is 23`
    });
  }

  // Validate each node in the directory
  for (const [key, node] of entries) {
    const nodePath = currentPath ? `${currentPath}/${key}` : key;
    
    // Validate node structure
    if (!node || typeof node !== 'object') {
      errors.push({
        path: nodePath,
        message: 'Node must be a valid object'
      });
      continue;
    }

    // Validate required properties
    if (!node.name || typeof node.name !== 'string') {
      errors.push({
        path: nodePath,
        message: 'Node must have a valid name property'
      });
    }

    if (!node.type || typeof node.type !== 'string') {
      errors.push({
        path: nodePath,
        message: 'Node must have a valid type property'
      });
      continue;
    }

    // Validate node type
    const validTypes = ['directory', 'action', 'input', 'virtual-directory'];
    if (!validTypes.includes(node.type)) {
      errors.push({
        path: nodePath,
        message: `Invalid node type '${node.type}'. Valid types are: ${validTypes.join(', ')}`
      });
      continue;
    }

    // Type-specific validation
    switch (node.type) {
      case 'directory':
        if (node.children) {
          if (typeof node.children !== 'object') {
            errors.push({
              path: nodePath,
              message: 'Directory node children must be a valid object'
            });
          } else {
            // Recursively validate children
            const childValidation = validateDirectoryTree(node.children, nodePath);
            errors.push(...childValidation.errors);
          }
        }
        break;

      case 'action':
        if (node.action && typeof node.action !== 'function') {
          errors.push({
            path: nodePath,
            message: 'Action node must have a valid action function'
          });
        }
        break;

      case 'input':
        if (node.localStorageKey && typeof node.localStorageKey !== 'string') {
          errors.push({
            path: nodePath,
            message: 'Input node localStorageKey must be a string'
          });
        }
        break;

      case 'virtual-directory':
        if (node.onSelect && typeof node.onSelect !== 'function') {
          errors.push({
            path: nodePath,
            message: 'Virtual directory node must have a valid onSelect function'
          });
        }
        // Note: Virtual directory content validation occurs when onSelect is called
        // and the returned tree is processed through createDirTree
        break;
    }

    // Validate that key matches node name
    if (node.name && key !== node.name) {
      errors.push({
        path: nodePath,
        message: `Key '${key}' does not match node name '${node.name}'`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a directory tree and throws an error if validation fails
 * @param tree The directory tree to validate
 * @param throwOnError Whether to throw an error if validation fails (default: true)
 * @returns ValidationResult
 * @throws Error if validation fails and throwOnError is true
 */
export function validateDirectoryTreeStrict(tree: DirTree, throwOnError: boolean = true): ValidationResult {
  const result = validateDirectoryTree(tree);
  
  if (!result.isValid && throwOnError) {
    const errorMessages = result.errors.map(error => `${error.path}: ${error.message}`);
    throw new Error(`Directory tree validation failed:\n${errorMessages.join('\n')}`);
  }
  
  return result;
}