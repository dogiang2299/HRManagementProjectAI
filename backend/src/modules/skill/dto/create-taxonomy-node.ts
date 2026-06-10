export class CreateTaxonomyNodeDto {
  node_type: 'GROUP' | 'SUBGROUP';
  name: string;
  parent_id?: string;
  description?: string;
  sort_order?: number;
}
