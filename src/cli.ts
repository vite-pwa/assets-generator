import { startCli } from './cli-start.ts'
import { handleError } from './errors.ts'

startCli().catch(handleError)
