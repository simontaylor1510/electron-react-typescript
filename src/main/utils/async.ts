export async function asyncForEach(array: any[], callback: (item: any, index: number, items: any[]) => void) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export async function delay(delayPeriod: number) {
    return new Promise(function (resolve, _) {
        setTimeout(function () {
            resolve(delayPeriod);
        }, delayPeriod);
    });
}