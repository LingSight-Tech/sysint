import COS from 'cos-nodejs-sdk-v5'
import { defaultStaticJsonFileConfigCenter as config } from '../infra/config.mjs'

class CosService {
  private cos: COS
  constructor(private config: {
    bucket: string
    region: string
    secretId: string
    secretKey: string
  }) {
    this.cos = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
      FileParallelLimit: 100,
      ChunkParallelLimit: 100,
    })
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cos.getObjectUrl({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        Method: 'PUT',
        Headers: {
          'content-type': contentType,
        },
        Sign: true,
      }, (err, data) => {
        if (err) {
          reject(err)
          return
        }

        resolve(data.Url)
      })
    })
  }

  async getObjectPreviewUrl(key: string, expireInMills: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cos.getObjectUrl({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        Method: 'GET',
        Sign: true,
        Expires: expireInMills / 1000,
      }, (err, data) => {
        if (err) {
          reject(err)
          return
        }

        resolve(data.Url)
      })
    })
  }
}

export const defaultCosService = new CosService({
  bucket: config.get('tencent-cloud.bucket'),
  region: config.get('tencent-cloud.region'),
  secretId: config.get('tencent-cloud.secret-id'),
  secretKey: config.get('tencent-cloud.secret-key'),
})
