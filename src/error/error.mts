export class BusinessException extends Error {
  constructor(public status: 400 | 500, message: string) {
    super(message)
    this.name = 'BusinessException'
  }
}
