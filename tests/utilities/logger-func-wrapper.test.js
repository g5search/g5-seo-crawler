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
          fun('foo', 123)
        } catch {}

        expect(logger.error).toBeCalledTimes(1)
        expect(logger.error).toBeCalledWith(
          '"myInvalidFunction" threw an error! (Error message: Something went wrong)',
          { error, params: ['foo', 123] }
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

    describe('with nested errors', () => {
      const error = new Error('My error')
      const func3 = loggerFuncWrapper('func3', () => { throw error })
      const func2 = loggerFuncWrapper('func2', () => { func3(); })
      const func1 = loggerFuncWrapper('func1', () => { func2(); })
      const main = loggerFuncWrapper('main', () => { func1(); })

      it('logs detailed error only for the the function that throw ("func3")', () => {
        try {
          main()
        } catch {}

        expect(logger.error).toBeCalledTimes(4)
        expect(logger.error).toHaveBeenNthCalledWith(1,
          '"func3" threw an error! (Error message: My error)', { error, params: [] }
        )
        expect(logger.error).toHaveBeenNthCalledWith(2,
          '"func2" threw an error due to "func3". (Check "func3" error for more info)',
        )
        expect(logger.error).toHaveBeenNthCalledWith(3,
          '"func1" threw an error due to "func2". (Check "func2" error for more info)',
        )
        expect(logger.error).toHaveBeenNthCalledWith(4,
          '"main" threw an error due to "func1". (Check "func1" error for more info)',
        )
      })

      it('throws an error without too much details', () => {
        expect(main).toThrow('"main" threw an error due to "func1". (Check "func1" error for more info)')
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
          await fun(123, 'test')
        } catch {}

        expect(logger.error).toBeCalledTimes(1)
        expect(logger.error).toBeCalledWith(
          '"myInvalidFunction" threw an error! (Error message: Something went wrong)',
          { error, params: [123, 'test'] }
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

    describe('with nested errors', () => {
      const error = new Error('My error')
      const func3 = loggerFuncWrapperAsync('func3', async () => {
        await sleep(1)
        throw error
      })
      const func2 = loggerFuncWrapperAsync('func2', async () => { await func3(); })
      const func1 = loggerFuncWrapperAsync('func1', async () => { await func2(); })
      const main = loggerFuncWrapperAsync('main', async () => { await func1(); })

      it('logs detailed error only for the the function that throw ("func3")', async () => {
        try {
          await main()
        } catch {}

        expect(logger.error).toBeCalledTimes(4)
        expect(logger.error).toHaveBeenNthCalledWith(1,
          '"func3" threw an error! (Error message: My error)', { error, params: [] }
        )
        expect(logger.error).toHaveBeenNthCalledWith(2,
          '"func2" threw an error due to "func3". (Check "func3" error for more info)',
        )
        expect(logger.error).toHaveBeenNthCalledWith(3,
          '"func1" threw an error due to "func2". (Check "func2" error for more info)',
        )
        expect(logger.error).toHaveBeenNthCalledWith(4,
          '"main" threw an error due to "func1". (Check "func1" error for more info)',
        )
      })

      it('throws an error without too much details', async () => {
        await expect(main)
          .rejects
          .toThrow('"main" threw an error due to "func1". (Check "func1" error for more info)')
      })
    })
  })
})
