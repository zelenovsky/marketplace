import { getProducts } from '../../payload/products';
import { buildProduct } from '../../utils/products';

export const GET = async () => {
  const products = await getProducts();

  const res = products.map(buildProduct);

  return new Response(JSON.stringify(res));
}
