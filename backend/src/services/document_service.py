import base64
import io
import traceback
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

from PIL import Image
import numpy as np

try:
    import fitz
    PDF_SUPPORT = True
    print(f"PyMuPDF disponível (versão {fitz.version[0]}) - suporte a PDF ativado")
except ImportError:
    PDF_SUPPORT = False
    print("PyMuPDF não disponível - suporte a PDF desativado")

try:
    import cv2
    CV_AVAILABLE = True
    print("OpenCV disponível - análise básica de imagem ativada")
except ImportError as e:
    print(f"Erro ao importar OpenCV: {e}")
    CV_AVAILABLE = False

def pdf_to_image(pdf_bytes: bytes) -> Tuple[Optional[Image.Image], Optional[bytes]]:
    if not PDF_SUPPORT:
        print("Suporte a PDF não disponível (PyMuPDF não instalado)")
        return None, None
        
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        if pdf_document.page_count == 0:
            print("PDF não contém páginas")
            return None, None
            
        first_page = pdf_document[0]
        
        zoom_x = 3.0
        zoom_y = 3.0
        mat = fitz.Matrix(zoom_x, zoom_y)
        
        pix = first_page.get_pixmap(matrix=mat, alpha=False)
        
        img_bytes = pix.tobytes("jpeg")
        
        pil_image = Image.open(io.BytesIO(pix.tobytes("png")))
        
        return pil_image, img_bytes
        
    except Exception as e:
        print(f"Erro ao converter PDF para imagem: {e}")
        traceback.print_exc()
        return None, None

def base64_to_image(base64_str: str, is_pdf: bool = False) -> Tuple[Optional[np.ndarray], Optional[Image.Image]]:
    try:
        if not base64_str:
            print("String base64 vazia")
            return None, None
        
        print(f"Base64 string prefix: {base64_str[:30]}...")
        
        if ';base64,' in base64_str:
            header, base64_str = base64_str.split(';base64,', 1)
            print(f"Detected MIME type: {header}")
            
            if 'application/pdf' in header:
                is_pdf = True
                print("Detectado conteúdo PDF pelo MIME type")
                
        elif ',' in base64_str:
            header, base64_str = base64_str.split(',', 1)
            print(f"Detected header: {header}")
            
            if 'application/pdf' in header:
                is_pdf = True
                print("Detectado conteúdo PDF pelo MIME type")
            
        base64_str = base64_str.strip()
        
        try:
            print(f"Decodifying base64 string with length: {len(base64_str)}")
            img_bytes = base64.b64decode(base64_str)
            print(f"Decoded bytes length: {len(img_bytes)}")
            
            if not img_bytes:
                print("Bytes de imagem vazios após decodificação")
                return None, None
            
            if is_pdf:
                print("Processando conteúdo PDF")
                if not PDF_SUPPORT:
                    print("Suporte a PDF não disponível")
                    return None, None
                    
                pil_image, _ = pdf_to_image(img_bytes)
                if pil_image is None:
                    print("Falha ao converter PDF para imagem")
                    return None, None
                    
                print(f"PDF convertido para imagem: {pil_image.format}, size: {pil_image.size}")
                
                if CV_AVAILABLE:
                    img_array = np.array(pil_image)
                    if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                        cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    else:
                        cv_image = img_array
                        
                    return cv_image, pil_image
                else:
                    return None, pil_image
            else:
                try:
                    pil_image = Image.open(io.BytesIO(img_bytes))
                    print(f"PIL image loaded successfully: {pil_image.format}, size: {pil_image.size}")
                    
                    if CV_AVAILABLE:
                        img_array = np.array(pil_image)
                        if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                            cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                        else:
                            cv_image = img_array
                            
                        return cv_image, pil_image
                    else:
                        return None, pil_image
                except Exception as pil_error:
                    print(f"Error opening image with PIL: {pil_error}")
                    traceback.print_exc()
                    return None, None
                
        except base64.binascii.Error as be:
            print(f"Erro no formato base64: {be}")
            try:
                missing_padding = len(base64_str) % 4
                if missing_padding:
                    base64_str += '=' * (4 - missing_padding)
                    print(f"Added padding. New length: {len(base64_str)}")
                img_bytes = base64.b64decode(base64_str)
                print(f"Successfully decoded with padding. Bytes length: {len(img_bytes)}")
                
                if is_pdf:
                    pil_img, _ = pdf_to_image(img_bytes)
                    if pil_img is None:
                        return None, None
                    
                    if CV_AVAILABLE:
                        img_array = np.array(pil_img)
                        if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                            cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                        else:
                            cv_image = img_array
                        return cv_image, pil_img
                    else:
                        return None, pil_img
                else:
                    pil_img = Image.open(io.BytesIO(img_bytes))
                    print(f"PIL image loaded with padding adjustment: {pil_img.format}, size: {pil_img.size}")
                    
                    if CV_AVAILABLE:
                        img_array = np.array(pil_img)
                        if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                            cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                        else:
                            cv_image = img_array
                        return cv_image, pil_img
                    else:
                        return None, pil_img
            except Exception as inner_e:
                print(f"Erro na tentativa alternativa de decodificação: {inner_e}")
                traceback.print_exc()
                return None, None
    except Exception as e:
        print(f"Erro ao converter base64 para imagem: {e}")
        traceback.print_exc()
        return None, None

def extract_face_from_image(image: np.ndarray) -> Optional[np.ndarray]:
    if not CV_AVAILABLE or image is None:
        return None
    
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
            
            face = image[y:y+h, x:x+w]
            return face
        
        return None
    except Exception as e:
        print(f"Erro na extração da face: {e}")
        traceback.print_exc()
        return None

def compare_faces_simple(face1: np.ndarray, face2: np.ndarray) -> Dict[str, Any]:
    if not CV_AVAILABLE or face1 is None or face2 is None:
        return {
            "verified": False,
            "distance": None,
            "score": 0,
            "method": "none",
            "error": "OpenCV não disponível ou faces não detectadas"
        }
    
    try:
        face1 = cv2.resize(face1, (100, 100))
        face2 = cv2.resize(face2, (100, 100))
        
        gray1 = cv2.cvtColor(face1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(face2, cv2.COLOR_BGR2GRAY)
        
        hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])
        
        cv2.normalize(hist1, hist1, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, 0, 1, cv2.NORM_MINMAX)
        
        similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        
        threshold = 0.75
        
        return {
            "verified": similarity > threshold,
            "distance": 1.0 - similarity,
            "score": similarity,
            "method": "histogram_correlation",
            "threshold": threshold
        }
    except Exception as e:
        print(f"Erro na comparação facial simples: {e}")
        traceback.print_exc()
        return {
            "verified": False,
            "distance": None,
            "score": 0,
            "method": "error",
            "error": str(e)
        }

def analyze_image_quality(image: np.ndarray) -> Dict[str, Any]:
    if not CV_AVAILABLE or image is None:
        return {
            "quality": "desconhecida",
            "blur_score": None, 
            "brightness": None,
            "width": None,
            "height": None
        }
    
    try:
        height, width = image.shape[:2]
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        brightness = np.mean(gray)
        
        quality = "média"
        if blur_score > 100 and brightness > 80 and brightness < 220 and width > 600:
            quality = "boa"
        elif blur_score < 50 or brightness < 50 or brightness > 240 or width < 300:
            quality = "baixa"
        
        return {
            "quality": quality,
            "blur_score": blur_score,
            "brightness": brightness,
            "width": width,
            "height": height
        }
    except Exception as e:
        print(f"Erro na análise de qualidade: {e}")
        return {
            "quality": "desconhecida",
            "error": str(e)
        }

def extract_document_info(file_name: str) -> Dict[str, Any]:
    file_lower = file_name.lower()
    
    document_type_mapping = {
        "rg": "RG",
        "cnh": "CNH",
        "address_proof": "Comprovante de Residência",
        "profile_photo": "Foto de Perfil",
        "unknown": "Tipo Desconhecido" 
    }
    
    doc_type = "unknown"
    if any(term in file_lower for term in ["rg", "identidade", "id"]):
        doc_type = "rg"
    elif any(term in file_lower for term in ["cnh", "motorista", "habilitacao", "habilitação"]):
        doc_type = "cnh"
    elif any(term in file_lower for term in ["endereco", "endereço", "comprovante", "residencia", "residência"]):
        doc_type = "address_proof"
    elif any(term in file_lower for term in ["selfie", "face", "foto", "perfil", "profile"]):
        doc_type = "profile_photo"
    
    display_type = document_type_mapping.get(doc_type, "Tipo Desconhecido")
    
    return {
        "document_type": doc_type,
        "document_type_display": display_type,
        "confidence": 0.6,
        "extracted_from": "filename_analysis"
    }

def format_datetime(dt):
    try:
        if isinstance(dt, str):
            from datetime import datetime
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        
        return dt.strftime("%d/%m/%Y %H:%M")
    except:
        return dt if isinstance(dt, str) else str(dt)

def extract_document_data(image: np.ndarray, document_type: str) -> Dict[str, Any]:
    return {}

def analyze_document(document_data: Dict[str, Any], selfie_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not document_data or not isinstance(document_data, dict):
        return {
            "success": False,
            "message": "Dados do documento insuficientes ou inválidos"
        }
        
    if 'content' not in document_data or 'file_name' not in document_data:
        return {
            "success": False,
            "message": "Dados do documento incompletos (falta content ou file_name)"
        }
    
    file_name = document_data.get("file_name", "")
    file_ext = file_name.lower().split('.')[-1] if '.' in file_name else ""
    
    is_pdf = file_ext == 'pdf'
    
    allowed_formats = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'pdf']
    if file_ext not in allowed_formats:
        return {
            "success": False,
            "message": f"Formato de arquivo não suportado: {file_ext}. Use JPG, PNG, PDF ou similar."
        }
    
    if is_pdf and not PDF_SUPPORT:
        return {
            "success": False,
            "message": "Arquivos PDF não são suportados neste servidor (PyMuPDF não instalado)."
        }
        
    basic_doc_info = extract_document_info(document_data.get("file_name", "documento.jpg"))
    
    current_time = datetime.now()
    result = {
        "success": True,
        "message": "Documento processado com análise básica",
        "extracted_data": {
            "tipo_documento": basic_doc_info.get("document_type_display", "Tipo Desconhecido"),
            "nome_arquivo": document_data.get("file_name", "documento.jpg"),
            "data_processamento": format_datetime(current_time)
        },
        "face_verification": {
            "verified": False,
            "available": False,
            "method": "simple_comparison"
        },
        "detection_info": basic_doc_info,
        "image_analysis": {},
        "cv_available": CV_AVAILABLE,
        "timestamp": current_time.isoformat()
    }
    
    try:
        if not CV_AVAILABLE:
            result["message"] = "Análise básica disponível (sem OpenCV)"
            result["image_analysis"] = {"status": "unavailable", "reason": "OpenCV não disponível"}
            return result
        
        if is_pdf:
            print("Processando arquivo PDF...")
            try:
                img_bytes = base64.b64decode(document_data["content"].split(',', 1)[-1].strip())
                pil_image, processed_image_bytes = pdf_to_image(img_bytes)
                
                if pil_image is None:
                    return {
                        "success": False,
                        "message": "Falha ao processar o PDF. Verifique se o arquivo não está corrompido."
                    }
                
                img_array = np.array(pil_image)
                if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                    doc_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                else:
                    doc_image = img_array
                
                if processed_image_bytes:
                    result["processed_image"] = base64.b64encode(processed_image_bytes).decode('utf-8')
                    print("Imagem processada adicionada ao resultado")
            except Exception as e:
                print(f"Erro processando PDF: {e}")
                traceback.print_exc()
                return {
                    "success": False,
                    "message": f"Erro ao processar o PDF: {str(e)}"
                }
        else:
            doc_image, pil_image = base64_to_image(document_data["content"])
            
        if doc_image is None:
            error_msg = "Falha ao processar a imagem do documento. Verifique o formato."
            if is_pdf:
                error_msg = "Falha ao processar o PDF. Verifique se o arquivo não está corrompido."
                
            print(error_msg)
            result["message"] = error_msg
            result["image_analysis"] = {"status": "error", "reason": "Falha na conversão da imagem"}
            result["success"] = False
            return result
        
        quality_info = analyze_image_quality(doc_image)
        result["image_analysis"] = quality_info
        
        doc_face = extract_face_from_image(doc_image)
        if doc_face is not None:
            result["has_face"] = True
            result["extracted_data"]["face_detected"] = True
        else:
            result["has_face"] = False
            result["extracted_data"]["face_detected"] = False
        
        doc_type = basic_doc_info.get("document_type", "unknown")
        additional_data = extract_document_data(doc_image, doc_type)
        
        result["extracted_data"].update(additional_data)
        
        if "analysis_result" in result:
            if result["analysis_result"].get("status") == "ocr_unavailable":
                result["analysis_result"]["status"] = "basic_analysis"
        else:
            result["analysis_result"] = {
                "status": "basic_analysis",
                "message": "Análise básica realizada com sucesso",
                "confidence": 0.7
            }
        
        result["extracted_data"].update({
            "qualidade_imagem": quality_info.get("quality", "unknown"),
            "dimensoes": f"{quality_info.get('width', 'N/A')}x{quality_info.get('height', 'N/A')}"
        })
        
        if is_pdf:
            result["extracted_data"]["formato_original"] = "PDF"
            result["message"] = "Documento PDF processado com sucesso (primeira página)"
        
        if selfie_data and selfie_data.get("content"):
            selfie_image, _ = base64_to_image(selfie_data["content"])
            if selfie_image is None:
                result["message"] = "Documento processado, mas falha ao processar a selfie"
                result["face_verification"]["error"] = "Falha na conversão da imagem da selfie"
                return result
            
            selfie_face = extract_face_from_image(selfie_image)
            
            if doc_face is None:
                result["message"] = "Documento processado, mas não foi possível detectar face no documento"
                result["face_verification"]["error"] = "Face não detectada no documento"
            elif selfie_face is None:
                result["message"] = "Documento processado, mas não foi possível detectar face na selfie"
                result["face_verification"]["error"] = "Face não detectada na selfie"
            else:
                verification_result = compare_faces_simple(doc_face, selfie_face)
                result["face_verification"] = verification_result
                result["face_verification"]["available"] = True
                
                if verification_result.get("verified", False):
                    result["message"] = "Documento analisado e verificação facial bem-sucedida"
                    result["success"] = True
                else:
                    result["message"] = "Documento analisado, mas a verificação facial falhou"
                    result["success"] = True
        
        return result
    except Exception as e:
        print(f"Erro analisando documento: {e}")
        traceback.print_exc()
        result["message"] = f"Erro ao analisar documento: {str(e)}"
        result["error_details"] = {
            "type": str(type(e).__name__),
            "traceback": traceback.format_exc().split("\n")[-3:]
        }
        result["success"] = False
        return result