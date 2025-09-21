import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
    publicImages: es
        .imageBucket({
            accept: ['image/*'],
            maxSize: 5 * 1024 * 1024, // 5MB
        })
        .beforeDelete(() => {
            return true;
        }),
});

const handler = createEdgeStoreNextHandler({
    router: edgeStoreRouter,
});

export { handler as GET, handler as POST, handler as DELETE };

export type EdgeStoreRouter = typeof edgeStoreRouter;
