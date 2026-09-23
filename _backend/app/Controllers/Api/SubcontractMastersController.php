<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;

class SubcontractMastersController extends SubcontractApiController
{
 public function index():ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$db=db_connect();$map=['contractor_types'=>['subcontractors_contractor_type_masters','sort_order'],'contractor_statuses'=>['subcontractors_status_masters','sort_order'],'document_statuses'=>['subcontractor_documents_verification_status_masters','sort_order'],'work_order_statuses'=>['subcontract_work_orders_status_masters','sort_order'],'measurement_statuses'=>['subcontract_measurements_status_masters','sort_order'],'bill_statuses'=>['subcontract_ra_bills_status_masters','sort_order'],'bill_payment_statuses'=>['subcontract_ra_bills_payment_status_masters','sort_order'],'payment_modes'=>['subcontract_payments_payment_mode_masters','sort_order'],'payment_statuses'=>['subcontract_payments_status_masters','sort_order']];$out=[];foreach($map as$k=>[$t,$o])$out[$k]=$db->table($t)->where('is_active',1)->orderBy($o)->get()->getResultArray();$out['document_types']=$db->table('document_types')->where(['company_id'=>$this->company($u),'is_active'=>1])->where('deleted_at',null)->orderBy('display_order')->get()->getResultArray();return$this->ok('Subcontract masters retrieved successfully.','masters',$out);}
 public function contractors():ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$b=db_connect()->table('subcontractors c')->select('c.*,t.contractor_type_code,t.contractor_type_name,s.status_code,s.status_name')->join('subcontractors_contractor_type_masters t','t.id=c.contractor_type_id')->join('subcontractors_status_masters s','s.id=c.status_id')->where('c.company_id',$this->company($u))->where('c.deleted_at',null);$q=trim((string)$this->request->getGet('search'));if($q!=='')$b->groupStart()->like('c.contractor_code',$q)->orLike('c.contractor_name',$q)->orLike('c.phone',$q)->groupEnd();return$this->ok('Subcontractors retrieved successfully.','subcontractors',$b->orderBy('c.id','DESC')->get()->getResultArray());}
 public function contractor(int$id):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row('subcontractors',$id,$this->company($u));if(!$r)return$this->missing();$r['documents']=db_connect()->table('subcontractor_documents')->where(['company_id'=>$this->company($u),'contractor_id'=>$id])->where('deleted_at',null)->orderBy('id','DESC')->get()->getResultArray();return$this->ok('Subcontractor retrieved successfully.','subcontractor',$r);}
 public function create():ResponseInterface{return$this->save(null);}public function update(int$id):ResponseInterface{return$this->save($id);}
 private function save(?int$id):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$in=$this->input();if($in===null)return$this->invalid(['body'=>'A valid JSON body is required.']);$c=$this->company($u);$old=$id?$this->row('subcontractors',$id,$c):null;if($id&&!$old)return$this->missing();$fs=['contractor_code','contractor_name','contractor_type_id','contact_person','phone','alternate_phone','email','gstin','pan','address_line1','address_line2','city','district','state_name','postal_code','bank_name','bank_account_name','bank_account_no','bank_ifsc','default_retention_percent','default_tds_percent','payment_terms_days','status_id','notes'];$d=array_intersect_key($in,array_flip($fs));$m=array_merge($old??[],$d);$e=$this->required($m,['contractor_code','contractor_name','contractor_type_id','status_id']);foreach([['subcontractors_contractor_type_masters','contractor_type_id'],['subcontractors_status_masters','status_id']]as[$t,$f])if(!$this->masterId($t,$f==='contractor_type_id'?'contractor_type_code':'status_code',$this->code($t,$f==='contractor_type_id'?'contractor_type_code':'status_code',(int)($m[$f]??0))))$e[$f]='Select a valid active master value.';$dup=db_connect()->table('subcontractors')->where(['company_id'=>$c,'contractor_code'=>$m['contractor_code']??''])->where('deleted_at',null);if($id)$dup->where('id !=',$id);if($dup->countAllResults())$e['contractor_code']='Contractor code already exists.';if($e)return$this->invalid($e);$d['updated_by']=(int)$u->id;$d['updated_at']=$this->now();$db=db_connect();if($id)$db->table('subcontractors')->where('id',$id)->update($d);else{$d+=['company_id'=>$c,'created_by'=>(int)$u->id,'created_at'=>$this->now()];$db->table('subcontractors')->insert($d);$id=(int)$db->insertID();$this->logStatus('CONTRACTOR',$id,null,$this->code('subcontractors_status_masters','status_code',(int)$d['status_id']),'CREATED',$c,(int)$u->id,null);}return$this->contractor($id);}
 public function addDocument(int$id):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$c=$this->company($u);if(!$this->row('subcontractors',$id,$c))return$this->missing();$in=$this->input()??[];$e=$this->required($in,['document_name','file_name','file_path']);if($e)return$this->invalid($e);$d=array_intersect_key($in,array_flip(['document_type_id','document_name','document_number','issue_date','expiry_date','file_name','file_path','remarks']));$d+=['company_id'=>$c,'contractor_id'=>$id,'verification_status_id'=>$this->masterId('subcontractor_documents_verification_status_masters','verification_status_code','PENDING'),'created_by'=>(int)$u->id,'created_at'=>$this->now()];db_connect()->table('subcontractor_documents')->insert($d);return$this->ok('Subcontractor document created successfully.','document',$this->row('subcontractor_documents',(int)db_connect()->insertID(),$c),201);}
 public function verifyDocument(int$id,int$doc):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$c=$this->company($u);$r=$this->row('subcontractor_documents',$doc,$c);if(!$r||(int)$r['contractor_id']!==$id)return$this->missing();$in=$this->input()??[];$code=strtoupper((string)($in['status_code']??'VERIFIED'));if(!in_array($code,['VERIFIED','REJECTED','EXPIRED'],true))return$this->invalid(['status_code'=>'Use VERIFIED, REJECTED or EXPIRED.']);$sid=$this->masterId('subcontractor_documents_verification_status_masters','verification_status_code',$code);db_connect()->table('subcontractor_documents')->where('id',$doc)->update(['verification_status_id'=>$sid,'verified_by'=>(int)$u->id,'verified_at'=>$this->now(),'remarks'=>$in['remarks']??$r['remarks']]);return$this->ok('Document status updated successfully.','document',$this->row('subcontractor_documents',$doc,$c));}

 public function contractorTypes(): ResponseInterface {
     $u = $this->user(); if (!$u) return $this->unauthorized();
     $b = db_connect()->table('subcontractors_contractor_type_masters');
     return $this->ok('Contractor types retrieved successfully.', 'contractor_types', $b->orderBy('sort_order')->orderBy('contractor_type_name')->get()->getResultArray());
 }

 public function contractorType(int $id): ResponseInterface {
     $u = $this->user(); if (!$u) return $this->unauthorized();
     $r = db_connect()->table('subcontractors_contractor_type_masters')->where('id', $id)->get()->getRowArray();
     return $r ? $this->ok('Record retrieved successfully.', 'contractor_type', $r) : $this->notFound();
 }

 public function createContractorType(): ResponseInterface { return $this->saveContractorType(null); }
 public function updateContractorType(int $id): ResponseInterface { return $this->saveContractorType($id); }

 public function deleteContractorType(int $id): ResponseInterface {
     $u = $this->user(); if (!$u) return $this->unauthorized();
     $db = db_connect();
     $r = $db->table('subcontractors_contractor_type_masters')->where('id', $id)->get()->getRowArray();
     if (!$r) return $this->notFound();
     
     if ($db->table('subcontractors')->where('contractor_type_id', $id)->where('deleted_at', null)->countAllResults() > 0) {
         return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Record is in use.']);
     }
     
     $db->table('subcontractors_contractor_type_masters')->where('id', $id)->delete();
     return $this->response->setJSON(['success' => true, 'message' => 'Record deleted successfully.']);
 }

 private function saveContractorType(?int $id): ResponseInterface {
     $u = $this->user(); if (!$u) return $this->unauthorized();
     $in = $this->input(); if ($in === null) return $this->invalid(['body' => 'A valid JSON body is required.']);
     
     $db = db_connect();
     $old = $id ? $db->table('subcontractors_contractor_type_masters')->where('id', $id)->get()->getRowArray() : null;
     if ($id && !$old) return $this->notFound();

     $fields = ['contractor_type_code', 'contractor_type_name', 'description', 'is_active', 'sort_order'];
     if (isset($in['type_code'])) $in['contractor_type_code'] = $in['type_code'];
     if (isset($in['type_name'])) $in['contractor_type_name'] = $in['type_name'];
     
     $data = array_intersect_key($in, array_flip($fields));
     $merged = array_merge($old ?? [], $data);
     $errors = $this->required($merged, ['contractor_type_name']);
     
     if (empty($merged['contractor_type_code'])) {
          if (!$id) {
              $data['contractor_type_code'] = 'CT-' . strtoupper(substr(uniqid(), -4));
          }
     }
     
     $dup = $db->table('subcontractors_contractor_type_masters')->where('contractor_type_name', trim((string)($merged['contractor_type_name'] ?? '')));
     if ($id) $dup->where('id !=', $id);
     if ($dup->countAllResults()) $errors['contractor_type_name'] = 'This type name already exists.';

     if ($errors) return $this->invalid($errors);
     
     if ($id) {
         $db->table('subcontractors_contractor_type_masters')->where('id', $id)->update($data);
     } else {
         $db->table('subcontractors_contractor_type_masters')->insert($data);
         $id = (int)$db->insertID();
     }
     
     return $this->contractorType($id);
 }
}
