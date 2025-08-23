#!/usr/bin/env node
/**
 * backup-service.js
 * Comprehensive backup and disaster recovery service for MerajutASA.id
 * Implements automated backups, point-in-time recovery, and integrity verification
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';

const execAsync = promisify(exec);

// Backup configuration
const BACKUP_CONFIG = {
  backupDir: './artifacts/backups',
  compressionLevel: 6,
  retentionDays: 30,
  scheduleInterval: 3600000, // 1 hour
  criticalPaths: [
    './artifacts',
    './docs/governance',
    './.integrity',
    './data',
    './policies',
  ],
  excludePatterns: [
    '*.tmp',
    '*.log',
    'node_modules',
    '.git',
    'backups',
  ],
  maxBackupSize: 1024 * 1024 * 1024, // 1GB
  enableEncryption: false, // Set to true for production
  enableRemoteSync: false,  // Set to true for cloud backup
};

/**
 * Backup metadata structure
 */
class BackupMetadata {
  constructor(backupId, timestamp = new Date()) {
    this.backupId = backupId;
    this.timestamp = timestamp.toISOString();
    this.version = '1.0.0';
    this.type = 'full';
    this.status = 'created';
    this.files = [];
    this.totalSize = 0;
    this.compressedSize = 0;
    this.checksums = new Map();
    this.duration = 0;
    this.errors = [];
  }
}

/**
 * Backup service class
 */
class BackupService {
  constructor(config = BACKUP_CONFIG) {
    this.config = { ...BACKUP_CONFIG, ...config };
    this.isRunning = false;
    this.currentBackup = null;
  }

  /**
   * Initialize backup service
   */
  async initialize() {
    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });
      console.log('✅ Backup service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize backup service:', error);
      throw error;
    }
  }

  /**
   * Generate backup ID
   */
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `backup-${timestamp}-${random}`;
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Check if file should be excluded
   */
  shouldExcludeFile(filePath) {
    for (const pattern of this.config.excludePatterns) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(filePath)) {return true;}
      } else if (filePath.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get list of files to backup
   */
  async getFilesToBackup() {
    const files = [];

    for (const path of this.config.criticalPaths) {
      try {
        const stats = await fs.stat(path);

        if (stats.isFile()) {
          if (!this.shouldExcludeFile(path)) {
            files.push({
              path: path,
              size: stats.size,
              mtime: stats.mtime,
            });
          }
        } else if (stats.isDirectory()) {
          const dirFiles = await this.scanDirectory(path);
          files.push(...dirFiles);
        }
      } catch (error) {
        console.warn(`⚠️  Path not found: ${path}`);
      }
    }

    return files;
  }

  /**
   * Recursively scan directory for files
   */
  async scanDirectory(dirPath, basePath = dirPath) {
    const files = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        const relativePath = fullPath.replace(basePath, '').replace(/^\//, '');

        if (this.shouldExcludeFile(fullPath)) {
          continue;
        }

        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            relativePath: relativePath,
            size: stats.size,
            mtime: stats.mtime,
          });
        } else if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, basePath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Create compressed backup archive
   */
  async createBackupArchive(backupId, files) {
    const archivePath = `${this.config.backupDir}/${backupId}.tar.gz`;
    const metadataPath = `${this.config.backupDir}/${backupId}.metadata.json`;

    console.log(`📦 Creating backup archive: ${archivePath}`);

    try {
      // Create tar command
      const fileList = files.map(f => f.path).join(' ');
      const tarCommand = `tar -czf "${archivePath}" ${fileList}`;

      const { stdout, stderr } = await execAsync(tarCommand, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr) {
        console.warn('⚠️  Tar warnings:', stderr);
      }

      // Get archive size
      const archiveStats = await fs.stat(archivePath);

      console.log(`✅ Archive created: ${(archiveStats.size / 1024 / 1024).toFixed(2)} MB`);

      return {
        archivePath: archivePath,
        size: archiveStats.size,
        metadataPath: metadataPath,
      };
    } catch (error) {
      console.error('❌ Failed to create archive:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backupId) {
    const archivePath = `${this.config.backupDir}/${backupId}.tar.gz`;
    const metadataPath = `${this.config.backupDir}/${backupId}.metadata.json`;

    try {
      // Check if archive exists and is readable
      await fs.access(archivePath);

      // Verify tar archive integrity
      const { stdout, stderr } = await execAsync(`tar -tzf "${archivePath}" > /dev/null`);

      if (stderr) {
        throw new Error(`Archive verification failed: ${stderr}`);
      }

      // Check metadata file
      await fs.access(metadataPath);
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      // Verify archive checksum if stored
      if (metadata.archiveChecksum) {
        const currentChecksum = await this.calculateChecksum(archivePath);
        if (currentChecksum !== metadata.archiveChecksum) {
          throw new Error('Archive checksum mismatch');
        }
      }

      console.log('✅ Backup integrity verified');
      return true;
    } catch (error) {
      console.error('❌ Backup integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Create full system backup
   */
  async createBackup(type = 'full') {
    if (this.isRunning) {
      throw new Error('Backup operation already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const backupId = this.generateBackupId();

    console.log(`🚀 Starting ${type} backup: ${backupId}`);

    try {
      const metadata = new BackupMetadata(backupId);
      metadata.type = type;
      metadata.status = 'in_progress';

      // Get files to backup
      console.log('📋 Scanning files to backup...');
      const files = await this.getFilesToBackup();

      if (files.length === 0) {
        throw new Error('No files found to backup');
      }

      console.log(`📁 Found ${files.length} files to backup`);

      // Calculate total size
      metadata.totalSize = files.reduce((sum, file) => sum + file.size, 0);
      metadata.files = files;

      if (metadata.totalSize > this.config.maxBackupSize) {
        throw new Error(`Backup size exceeds maximum allowed size: ${metadata.totalSize} bytes`);
      }

      // Create backup archive
      const archive = await this.createBackupArchive(backupId, files);
      metadata.compressedSize = archive.size;

      // Calculate archive checksum
      metadata.archiveChecksum = await this.calculateChecksum(archive.archivePath);

      // Calculate compression ratio
      const compressionRatio = ((metadata.totalSize - metadata.compressedSize) / metadata.totalSize * 100).toFixed(2);
      console.log(`📊 Compression ratio: ${compressionRatio}%`);

      // Update metadata
      metadata.status = 'completed';
      metadata.duration = Date.now() - startTime;
      metadata.compressionRatio = parseFloat(compressionRatio);

      // Save metadata
      await fs.writeFile(archive.metadataPath, JSON.stringify(metadata, null, 2));

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backupId);
      if (!isValid) {
        metadata.status = 'failed';
        metadata.errors.push('Integrity verification failed');
      }

      console.log(`✅ Backup completed: ${backupId}`);
      console.log(`⏱️  Duration: ${(metadata.duration / 1000).toFixed(2)} seconds`);
      console.log(`💾 Size: ${(metadata.compressedSize / 1024 / 1024).toFixed(2)} MB`);

      this.currentBackup = metadata;
      return metadata;

    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const metadataFiles = files.filter(f => f.endsWith('.metadata.json'));

      const backups = [];

      for (const metadataFile of metadataFiles) {
        try {
          const content = await fs.readFile(`${this.config.backupDir}/${metadataFile}`, 'utf8');
          const metadata = JSON.parse(content);
          backups.push(metadata);
        } catch (error) {
          console.warn(`⚠️  Failed to read metadata: ${metadataFile}`);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId, targetDir = './') {
    const archivePath = `${this.config.backupDir}/${backupId}.tar.gz`;
    const metadataPath = `${this.config.backupDir}/${backupId}.metadata.json`;

    console.log(`🔄 Restoring backup: ${backupId}`);

    try {
      // Verify backup exists and is valid
      const isValid = await this.verifyBackupIntegrity(backupId);
      if (!isValid) {
        throw new Error('Backup integrity verification failed');
      }

      // Load metadata
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      console.log(`📦 Extracting ${metadata.files.length} files...`);

      // Extract archive
      const extractCommand = `tar -xzf "${archivePath}" -C "${targetDir}"`;
      const { stdout, stderr } = await execAsync(extractCommand);

      if (stderr) {
        console.warn('⚠️  Extract warnings:', stderr);
      }

      console.log('✅ Backup restored successfully');

      return {
        backupId: backupId,
        filesRestored: metadata.files.length,
        targetDir: targetDir,
        timestamp: metadata.timestamp,
      };

    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');

    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));

      let deletedCount = 0;

      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp);

        if (backupDate < cutoffDate) {
          try {
            // Delete archive and metadata
            await fs.unlink(`${this.config.backupDir}/${backup.backupId}.tar.gz`);
            await fs.unlink(`${this.config.backupDir}/${backup.backupId}.metadata.json`);

            console.log(`🗑️  Deleted old backup: ${backup.backupId}`);
            deletedCount++;
          } catch (error) {
            console.warn(`⚠️  Failed to delete backup ${backup.backupId}:`, error);
          }
        }
      }

      console.log(`🧹 Cleanup completed: ${deletedCount} backups deleted`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStatistics() {
    try {
      const backups = await this.listBackups();

      const stats = {
        totalBackups: backups.length,
        totalSize: 0,
        averageSize: 0,
        oldestBackup: null,
        newestBackup: null,
        completedBackups: 0,
        failedBackups: 0,
        compressionRatios: [],
      };

      for (const backup of backups) {
        stats.totalSize += backup.compressedSize || 0;

        if (backup.status === 'completed') {
          stats.completedBackups++;
        } else {
          stats.failedBackups++;
        }

        if (backup.compressionRatio) {
          stats.compressionRatios.push(backup.compressionRatio);
        }

        if (!stats.oldestBackup || new Date(backup.timestamp) < new Date(stats.oldestBackup.timestamp)) {
          stats.oldestBackup = backup;
        }

        if (!stats.newestBackup || new Date(backup.timestamp) > new Date(stats.newestBackup.timestamp)) {
          stats.newestBackup = backup;
        }
      }

      if (backups.length > 0) {
        stats.averageSize = stats.totalSize / backups.length;
      }

      if (stats.compressionRatios.length > 0) {
        stats.averageCompressionRatio = stats.compressionRatios.reduce((a, b) => a + b, 0) / stats.compressionRatios.length;
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get backup statistics:', error);
      return null;
    }
  }

  /**
   * Start scheduled backup service
   */
  startScheduledBackups() {
    console.log(`⏰ Starting scheduled backups every ${this.config.scheduleInterval / 1000 / 60} minutes`);

    const schedule = setInterval(async () => {
      try {
        console.log('⏰ Scheduled backup starting...');
        await this.createBackup('scheduled');
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, this.config.scheduleInterval);

    return schedule;
  }
}

// Export backup service
export { BackupService, BACKUP_CONFIG };

// Create default instance
const backupService = new BackupService();

export default backupService;
