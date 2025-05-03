from typing import Dict, Any, List, Tuple
import random
import re


class AIService:
    """
    Serviço simulado de IA para verificação de documentos e perfis de esports.
    Em uma implementação real, este serviço conectaria a APIs reais de IA.
    """
    
    @staticmethod
    def verify_document(document_url: str, doc_type: str, doc_number: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Verifica se um documento é válido.
        
        Args:
            document_url: URL da imagem do documento
            doc_type: Tipo do documento (ex: CPF, RG)
            doc_number: Número do documento
            
        Returns:
            Tuple contendo:
            - Boolean indicando se o documento é válido
            - Dicionário com detalhes da verificação
        """
        # Simular verificação com probabilidade de 95% de sucesso
        is_valid = random.random() < 0.95
        
        # Simular validação para CPF
        if doc_type.upper() == "CPF":
            # Verificar se o número do CPF tem 11 dígitos
            is_valid_format = re.match(r'^\d{11}$', doc_number.replace('.', '').replace('-', '')) is not None
        else:
            is_valid_format = True
            
        details = {
            "confidence": random.uniform(0.80, 0.99),
            "valid_format": is_valid_format,
            "ocr_success": True,
            "document_type_match": True,
            "tampering_detected": False,
        }
        
        return is_valid and is_valid_format, details
    
    @staticmethod
    def verify_esports_profile(platform: str, profile_url: str, username: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Verifica se um perfil de esports é válido e extrai jogos associados.
        
        Args:
            platform: Plataforma (ex: twitch, steam)
            profile_url: URL do perfil
            username: Nome de usuário
            
        Returns:
            Tuple contendo:
            - Boolean indicando se o perfil é válido
            - Dicionário com detalhes da verificação
        """
        # Simular verificação com probabilidade de 90% de sucesso
        is_valid = random.random() < 0.90
        
        # Simular jogos detectados com base na plataforma
        games = []
        if platform.lower() == "twitch":
            games = random.sample(["CS:GO", "Valorant", "League of Legends", "Dota 2", "Fortnite"], 
                                 k=random.randint(1, 3))
        elif platform.lower() == "steam":
            games = random.sample(["CS:GO", "Dota 2", "PUBG", "Apex Legends", "Team Fortress 2"],
                                 k=random.randint(1, 4))
        else:
            games = random.sample(["League of Legends", "Valorant", "Apex Legends"],
                                 k=random.randint(1, 2))
        
        # Simular outras estatísticas
        details = {
            "confidence": random.uniform(0.75, 0.98),
            "profile_exists": True,
            "games_detected": games,
            "activity_level": random.choice(["high", "medium", "low"]),
            "follower_count": random.randint(50, 10000),
            "esports_relevance": random.uniform(0.3, 0.9)
        }
        
        return is_valid, details
    
    @staticmethod
    def analyze_social_media(platform: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa dados de mídia social para extrair interesses relevantes a esports.
        
        Args:
            platform: Plataforma (ex: twitter, instagram, facebook)
            profile_data: Dados do perfil (em implementação real, seriam dados da API)
            
        Returns:
            Dicionário com interesses detectados
        """
        # Lista de organizações de esports para detecção simulada
        esports_orgs = ["FURIA", "Team Liquid", "Cloud9", "G2 Esports", "FaZe Clan", 
                        "100 Thieves", "T1", "Fnatic", "NRG", "Evil Geniuses"]
        
        # Simular detecção de organizações seguidas com probabilidade maior para FURIA
        followed_orgs = ["FURIA"] if random.random() < 0.8 else []
        
        # Adicionar algumas outras organizações aleatórias
        num_other_orgs = random.randint(0, 3)
        other_orgs = random.sample([org for org in esports_orgs if org != "FURIA"], k=min(num_other_orgs, len(esports_orgs)-1))
        followed_orgs.extend(other_orgs)
        
        # Simular detecção de jogos de interesse
        games_of_interest = random.sample(["CS:GO", "Valorant", "League of Legends", "Dota 2", "Fortnite"], 
                                          k=random.randint(1, 3))
        
        # Simular eventos com interesse
        events = []
        if random.random() < 0.7:
            events.append({
                "name": "FURIA Fan Fest 2023",
                "interest_level": "high"
            })
        
        if random.random() < 0.5:
            events.append({
                "name": "ESL Pro League",
                "interest_level": "medium"
            })
        
        if random.random() < 0.3:
            events.append({
                "name": "Valorant Champions Tour",
                "interest_level": "low"
            })
        
        return {
            "followed_orgs": followed_orgs,
            "games_of_interest": games_of_interest,
            "events": events,
            "engagement_level": random.choice(["high", "medium", "low"]),
            "fan_type": random.choice(["casual", "enthusiast", "hardcore"]),
            "content_creator": random.random() < 0.1
        } 