"""GridSathi India-wide EV station discovery. Google key stays server-side."""
import json, os, re, urllib.request, urllib.error
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
ROOT = Path(__file__).resolve().parents[1]
GOOGLE = 'https://places.googleapis.com/v1/'

def google_post(endpoint, payload, mask):
    key = os.getenv('GOOGLE_MAPS_API_KEY', '').strip()
    if not key: raise RuntimeError('GOOGLE_MAPS_API_KEY not configured')
    req = urllib.request.Request(GOOGLE+endpoint, data=json.dumps(payload).encode(),
        headers={'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':mask},method='POST')
    with urllib.request.urlopen(req,timeout=15) as response: return json.load(response)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def json_response(self,code,obj):
        body=json.dumps(obj,ensure_ascii=False).encode('utf-8');self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)))
        self.end_headers();self.wfile.write(body)
    def do_GET(self):
        u=urlparse(self.path)
        if u.path not in ('/api/stations','/api/locations','/api/config'): return super().do_GET()
        if u.path=='/api/config': return self.json_response(200,{'live_enabled':bool(os.getenv('GOOGLE_MAPS_API_KEY','').strip()),'country':'IN'})
        params=parse_qs(u.query)
        if u.path=='/api/locations':
            term=params.get('q',[''])[0].strip()
            if len(term)<2 or len(term)>100: return self.json_response(400,{'error':'Enter 2–100 characters'})
            if not os.getenv('GOOGLE_MAPS_API_KEY','').strip():
                return self.json_response(200,{'mode':'manual','locations':[], 'message':'Google Places key not configured. Enter any Indian city or town and press Search after configuring the key.'})
            try:
                data=google_post('places:autocomplete',{'input':term,'includedRegionCodes':['in'],'includedPrimaryTypes':['(cities)'],'languageCode':'en'},'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat')
                locations=[]
                for item in data.get('suggestions',[]):
                    prediction=item.get('placePrediction',{})
                    if prediction.get('text',{}).get('text'):
                        locations.append({'label':prediction['text']['text'],'place_id':prediction.get('placeId','')})
                return self.json_response(200,{'mode':'google-places-autocomplete','locations':locations})
            except urllib.error.HTTPError as e: return self.json_response(502,{'error':'Google location autocomplete failed','detail':e.read(300).decode(errors='replace')})
            except Exception as e: return self.json_response(502,{'error':'Location search unavailable','detail':str(e)})
        city=params.get('city',[''])[0].strip()
        if not 2<=len(city)<=120 or not re.fullmatch(r"[\w\s,.'()/-]+",city,re.UNICODE):
            return self.json_response(400,{'error':'Enter a valid Indian city or town (2–120 characters)'})
        if not os.getenv('GOOGLE_MAPS_API_KEY','').strip():
            return self.json_response(200,{'mode':'requires-api-key','city':city,'stations':[], 'message':'No live results without a Google Places API key. Configure GOOGLE_MAPS_API_KEY in the server environment.'})
        try:
            data=google_post('places:searchText',{'textQuery':'electric vehicle charging stations in '+city+', India','pageSize':20,'languageCode':'en','regionCode':'IN'},'places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.primaryType,places.location')
            rows=[]
            for v in data.get('places',[]):
                rows.append({'name':v.get('displayName',{}).get('text','Unnamed charging point'),'address':v.get('formattedAddress','Address unavailable'),'place_id':v.get('id',''),'maps_url':v.get('googleMapsUri',''),'lat':v.get('location',{}).get('latitude'),'lng':v.get('location',{}).get('longitude'),'primary_type':v.get('primaryType','')})
            self.json_response(200,{'mode':'google-places-live-search','city':city,'stations':rows,'message':'Google Places listings; occupancy, price, connector compatibility and booking are not verified. Results may include nearby locations.'})
        except urllib.error.HTTPError as e: self.json_response(502,{'error':'Google Places station search failed','detail':e.read(300).decode(errors='replace')})
        except Exception as e: self.json_response(502,{'error':'Station search unavailable','detail':str(e)})
if __name__=='__main__':
    print('GridSathi: http://localhost:8000 | Google Places key configured:',bool(os.getenv('GOOGLE_MAPS_API_KEY')))
    ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
