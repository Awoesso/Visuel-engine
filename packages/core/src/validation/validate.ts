import { PageDocumentSchema, type PageDocument } from '../schemas/document';
import type { ComponentNode } from '../schemas/node';
import {
  SECURITY_LIMITS,
  inspectTreeMetrics,
} from './security';

export interface ValidationErrorItem {
  path: string;
  message: string;
}

export interface ValidationSuccessResult {
  success: true;
  data: PageDocument;
}

export interface ValidationFailureResult {
  success: false;
  errors: ValidationErrorItem[];
}

export type ValidationResult = ValidationSuccessResult | ValidationFailureResult;

/**
 * Validates an untrusted input against the PageDocument specification,
 * enforcing schema conformance, resource limits, and unique node IDs.
 *
 * Resource limit pre-checks (depth <= 20, nodes <= 500) run BEFORE
 * recursive Zod schema validation to guard against DoS/deep-recursion attacks.
 */
export function validatePageDocument(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return {
      success: false,
      errors: [{ path: 'root', message: 'Input must be a valid JSON object' }],
    };
  }

  // 1. Check approximate payload size and circular references
  try {
    const rawString = JSON.stringify(input);
    const byteLength = new TextEncoder().encode(rawString).length;
    if (byteLength > SECURITY_LIMITS.MAX_DOCUMENT_SIZE_BYTES) {
      return {
        success: false,
        errors: [
          {
            path: 'root',
            message: `Document size (${byteLength} bytes) exceeds maximum limit of ${SECURITY_LIMITS.MAX_DOCUMENT_SIZE_BYTES} bytes`,
          },
        ],
      };
    }
  } catch {
    return {
      success: false,
      errors: [{ path: 'root', message: 'Document contains non-serializable circular references' }],
    };
  }

  // 2. Resource limit pre-checks (BEFORE expensive recursive Zod parsing)
  const rawSections = (input as { sections?: unknown }).sections;
  if (Array.isArray(rawSections)) {
    if (rawSections.length > SECURITY_LIMITS.MAX_SECTIONS) {
      return {
        success: false,
        errors: [
          {
            path: 'sections',
            message: `Sections count (${rawSections.length}) exceeds maximum limit of ${SECURITY_LIMITS.MAX_SECTIONS}`,
          },
        ],
      };
    }

    const metrics = inspectTreeMetrics(rawSections);
    if (metrics.maxDepth > SECURITY_LIMITS.MAX_NODE_DEPTH) {
      return {
        success: false,
        errors: [
          {
            path: 'sections',
            message: `Tree depth (${metrics.maxDepth}) exceeds maximum limit of ${SECURITY_LIMITS.MAX_NODE_DEPTH}`,
          },
        ],
      };
    }

    if (metrics.totalNodes > SECURITY_LIMITS.MAX_TOTAL_NODES) {
      return {
        success: false,
        errors: [
          {
            path: 'sections',
            message: `Total node count (${metrics.totalNodes}) exceeds maximum limit of ${SECURITY_LIMITS.MAX_TOTAL_NODES}`,
          },
        ],
      };
    }
  }

  // 3. Schema parsing (Zod)
  const parseResult = PageDocumentSchema.safeParse(input);
  if (!parseResult.success) {
    const errors: ValidationErrorItem[] = parseResult.error.errors.map((err) => ({
      path: err.path.join('.') || 'root',
      message: err.message,
    }));
    return { success: false, errors };
  }

  const document = parseResult.data;

  // 4. Check unique IDs across sections and component nodes
  const idMap = new Set<string>();
  const duplicateErrors: ValidationErrorItem[] = [];

  function checkNodeId(node: ComponentNode, path: string) {
    if (idMap.has(node.id)) {
      duplicateErrors.push({
        path,
        message: `Duplicate node ID detected: "${node.id}". All nodes must have globally unique IDs.`,
      });
    } else {
      idMap.add(node.id);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        checkNodeId(child, `${path}.children[${index}]`);
      });
    }
  }

  document.sections.forEach((section, sIndex) => {
    if (idMap.has(section.id)) {
      duplicateErrors.push({
        path: `sections[${sIndex}]`,
        message: `Duplicate section ID detected: "${section.id}".`,
      });
    } else {
      idMap.add(section.id);
    }

    section.children.forEach((child, cIndex) => {
      checkNodeId(child, `sections[${sIndex}].children[${cIndex}]`);
    });
  });

  if (duplicateErrors.length > 0) {
    return { success: false, errors: duplicateErrors };
  }

  return {
    success: true,
    data: document,
  };
}
