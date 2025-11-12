import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class LastfmAuthService {
  private readonly logger = new Logger(LastfmAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate API signature for Last.fm API requests
   * Last.fm uses MD5 hash of concatenated parameters + shared secret
   */
  generateApiSignature(params: Record<string, string>): string {
    const sharedSecret = this.configService.get<string>('LASTFM_SHARED_SECRET');
    
    // Sort parameters alphabetically and concatenate
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map((key) => `${key}${params[key]}`)
      .join('');
    
    // Add shared secret and create MD5 hash
    const signatureString = paramString + sharedSecret;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  /**
   * Get API key from configuration
   */
  getApiKey(): string {
    return this.configService.get<string>('LASTFM_API_KEY') || '';
  }

  /**
   * Get application name from configuration
   */
  getApplicationName(): string {
    return this.configService.get<string>('LASTFM_APPLICATION_NAME') || 'Songbird Player';
  }

  /**
   * Get registered user from configuration
   */
  getRegisteredTo(): string {
    return this.configService.get<string>('LASTFM_REGISTERED_TO') || '';
  }

  /**
   * Build query string with API key and signature
   */
  buildQueryString(params: Record<string, string>): string {
    const apiKey = this.getApiKey();
    const queryParams = {
      ...params,
      api_key: apiKey,
    };
    
    const signature = this.generateApiSignature(queryParams);
    queryParams.api_sig = signature;
    queryParams.format = 'json';

    return new URLSearchParams(queryParams).toString();
  }
}

