import overpy

#Overpass API object (wraps requests internally)
api = overpy.Overpass()

async def fetch_osm_map_data(bbox):
    """
    bbox = (south, west, north, east)
    Example: (11.0, 75.6, 11.4, 76.1) for Kozhikode district
    """

    # Build the Overpass QL query
    query = f"""
    [out:json][timeout:30];
    (
      node["amenity"="toilets"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      node["amenity"="restaurant"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      node["amenity"="fuel"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      node["shop"="mall"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out center;
    """

    try:
        # Run Overpass query
        result = api.query(query)

        # Parse nodes into simple Python dicts
        pois = []
        for node in result.nodes:
            pois.append({
                "id": node.id,
                "lat": node.lat,
                "lon": node.lon,
                "tags": node.tags
            })

        return pois

    except overpy.exception.OverpassTooManyRequests:
        # Too many requests → back off
        return {"error": "Overpass rate limit error"}

    except overpy.exception.OverpassGatewayTimeout:
        return {"error": "Overpass gateway timeout"}

    except Exception as e:
        return {"error": str(e)}
