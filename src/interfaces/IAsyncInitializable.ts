/**
 * Interface for objects that require asynchronous initialization
 */
export interface IAsyncInitializable {
  /**
   * Initialize the object asynchronously
   * @returns Promise that resolves when initialization is complete
   */
  initializeAsync(): Promise<void>;

  /**
   * Check if the object has been initialized
   */
  readonly isInitialized: boolean;
}

/**
 * Interface for objects that can be loaded asynchronously with progress tracking
 */
export interface IAsyncLoadable<T> {
  /**
   * Load the resource asynchronously
   * @param onProgress Optional progress callback
   * @returns Promise that resolves with the loaded resource
   */
  loadAsync(onProgress?: (progress: LoadProgress) => void): Promise<T>;
}

/**
 * Progress information for async loading operations
 */
export interface LoadProgress {
  /**
   * Number of items loaded
   */
  loaded: number;

  /**
   * Total number of items to load
   */
  total: number;

  /**
   * Current item being loaded (optional)
   */
  currentItem?: string;

  /**
   * Percentage of completion (0-100)
   */
  percentage: number;
}

/**
 * Result of a batch loading operation
 */
export interface BatchLoadResult<T> {
  /**
   * Successfully loaded items
   */
  loaded: T[];

  /**
   * Failed items with error information
   */
  failed: Array<{
    item: any;
    error: Error;
  }>;

  /**
   * Total time taken in milliseconds
   */
  totalTime: number;
}
