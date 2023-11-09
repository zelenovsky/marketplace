import { z } from "zod";

export const ImageResult = z
  .object({
    src: z.string(),
    srcset: z.string(),
    width: z.number(),
    height: z.number(),
    alt: z.string(),
    thumbnail: z.object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      alt: z.string(),
    }),
  });

export const SizeResult = z
  .object({
    inStockCount: z.number(),
    value: z.intersection(
      z.object({
        id: z.string()
      }),
      z.record(z.string())
    )
  });

export const ProductResult = z
  .object({
    id: z.string(),
    type: z.enum(['shoes', 'clothes', 'accessories']),
    title: z.string(),
    description: z.string(),
    price: z.number(),
    gallery: z.array(ImageResult),
    sizes: z.array(SizeResult)
  });

export const CartItemResult = z
  .object({
    id: z.string(), // consists of two parts: {id of product}:{id of size}
    product: ProductResult,
    size: SizeResult
  });

export const StorageCartItemResult = z
  .object({
    id: z.string(), // consists of two parts: {id of product}:{id of size}
    q: z.number()
  })