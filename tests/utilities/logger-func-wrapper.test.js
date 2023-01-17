const {
  loggerFuncWrapper,
  loggerFuncWrapperAsync,
} = require('../../src/utilities/logger-func-wrapper')
const logger = require('../../src/utilities/logger')

jest.mock('../../src/utilities/logger')

describe('Logger Func Wrapper', () => {
  describe('.loggerFuncWrapper', () => {
    const getFullName = jest.fn((firstName, lastName) => `${firstName} ${lastName}`)

    it('logs started function', () => {
      const func = loggerFuncWrapper('myFunctionName', getFullName)

      func('David', 'Muller')

      expect(logger.info).toHaveBeenNthCalledWith(1, '"myFunctionName" started!')
    })

    it('executes the wrapper function', () => {
      const func = loggerFuncWrapper('myFunctionName', getFullName)

      func('Felipe', 'Nolleto')

      expect(getFullName).toBeCalledTimes(1)
      expect(getFullName).toBeCalledWith('Felipe', 'Nolleto')
    })

    describe('when function fails', () => {
      const error = new Error('Something went wrong')
      const invalidFunc = jest.fn(() => {
        throw error
      })

      it('logs error message', () => {
        const fun = loggerFuncWrapper('myInvalidFunction', invalidFunc)

        try {
          fun()
        } catch {}

        expect(logger.error).toBeCalledTimes(1)
        expect(logger.error).toBeCalledWith(
          '"myInvalidFunction" threw an error! (Error message: Something went wrong)',
          { error }
        )
      })

      it('throws an error', () => {
        const fun = loggerFuncWrapper('myInvalidFunction', invalidFunc)

        expect(fun).toThrow(
          '"myInvalidFunction" threw an error! (Error message: Something went wrong)'
        )
      })
    })

    describe('when function complete successfully', () => {
      it('logs successfully message', () => {
        const func = loggerFuncWrapper('myFunctionName', getFullName)

        func('Felipe', 'Nolleto')

        expect(logger.info).toBeCalledTimes(2)
        expect(logger.info).toHaveBeenNthCalledWith(2, '"myFunctionName" executed successfully!')
      })

      it('returns function result', () => {
        const func = loggerFuncWrapper('myFunctionName', getFullName)
        const result = func('Felipe', 'Nolleto')

        expect(result).toBe('Felipe Nolleto')
      })
    })
  })

  describe('.loggerFuncWrapperAsync', () => {
    const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000))
    const getFullName = jest.fn(async (firstName, lastName) => {
      await sleep(1)
      return `${firstName} ${lastName}`
    })

    it('logs started function', async () => {
      const func = loggerFuncWrapperAsync('myFunctionName', getFullName)

      await func('David', 'Muller')

      expect(logger.info).toHaveBeenNthCalledWith(1, '"myFunctionName" started!')
    })

    it('executes the wrapper function', async () => {
      const func = loggerFuncWrapperAsync('myFunctionName', getFullName)

      await func('Felipe', 'Nolleto')

      expect(getFullName).toBeCalledTimes(1)
      expect(getFullName).toBeCalledWith('Felipe', 'Nolleto')
    })

    describe('when function fails', () => {
      const error = new Error('Something went wrong')
      const invalidFunc = jest.fn(async () => {
        await sleep(1)
        throw error
      })

      it('logs error message', async () => {
        const fun = loggerFuncWrapperAsync('myInvalidFunction', invalidFunc)

        try {
          await fun()
        } catch {}

        expect(logger.error).toBeCalledTimes(1)
        expect(logger.error).toBeCalledWith(
          '"myInvalidFunction" threw an error! (Error message: Something went wrong)',
          { error }
        )
      })

      it('throws an error', async () => {
        const fun = loggerFuncWrapperAsync('myInvalidFunction', invalidFunc)

        await expect(fun)
          .rejects
          .toThrow(
            '"myInvalidFunction" threw an error! (Error message: Something went wrong)'
          )
      })
    })

    describe('when function complete successfully', () => {
      it('logs successfully message', async () => {
        const func = loggerFuncWrapperAsync('myFunctionName', getFullName)

        await func('Felipe', 'Nolleto')

        expect(logger.info).toBeCalledTimes(2)
        expect(logger.info).toHaveBeenNthCalledWith(2, '"myFunctionName" executed successfully!')
      })

      it('returns function result', async () => {
        const func = loggerFuncWrapperAsync('myFunctionName', getFullName)
        const result = await func('Felipe', 'Nolleto')

        expect(result).toBe('Felipe Nolleto')
      })
    })
  })
})
