import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'
import type { DivisionSignal } from '@/lib/kernel/types'
import { getAssetTrack } from '@/lib/useAcquisitionSites'

export function evaluateGroundsStageTransition(
  asset: BeamAsset,
  targetStage: BeamAssetStage,
): Array<Omit<DivisionSignal, 'id' | 'createdAt' | 'updatedAt' | 'status'>> {
  const signals: Array<Omit<DivisionSignal, 'id' | 'createdAt' | 'updatedAt' | 'status'>> = []
  const track = getAssetTrack(asset)

  if (targetStage === 'CLAIM') {
    signals.push({
      sourceSite: 'grounds.beamthinktank.space',
      targetDivision: 'law',
      assetId: asset.id,
      assetName: asset.name,
      stage: targetStage,
      title: 'Title Record & Non-Speculation Covenant Audit',
      description: `Law division review required for parcel ${asset.address} entering CLAIM stage.`,
      urgency: 'standard',
      blocking: false,
    })
  }

  if (targetStage === 'ACCESS') {
    signals.push({
      sourceSite: 'grounds.beamthinktank.space',
      targetDivision: 'forge',
      assetId: asset.id,
      assetName: asset.name,
      stage: targetStage,
      title: 'Site Security & Entry Fitment',
      description: `Forge division site security inspection for ${asset.name}.`,
      urgency: 'critical',
      blocking: true,
    })

    // Track D Production Facility multi-division obligations
    if (track === 'D') {
      signals.push(
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'health',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Organic Food / Health Dept Facility Permit Review',
          description: `Health division permit clearance for Track D (${asset.productionLane || 'organic'}) production site at ${asset.address}.`,
          urgency: 'blocking',
          blocking: true,
        },
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'law',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Industrial Environmental Indemnity & Lease Review',
          description: `Law division environmental indemnity contract review for production hub at ${asset.address}.`,
          urgency: 'blocking',
          blocking: true,
        },
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'forge',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Heavy Power & Fabrication Equipment Hookup',
          description: `Forge division electrical & equipment fitment for industrial production facility.`,
          urgency: 'critical',
          blocking: true,
        },
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'environment',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Runoff & Chemical Site Assessment',
          description: `Environmental division soil and runoff assessment for production hub.`,
          urgency: 'critical',
          blocking: false,
        },
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'transportation',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Freight Dock & Logistics Route Scoping',
          description: `Transportation division loading dock and freight delivery route scoping.`,
          urgency: 'standard',
          blocking: false,
        },
        {
          sourceSite: 'grounds.beamthinktank.space',
          targetDivision: 'business',
          assetId: asset.id,
          assetName: asset.name,
          stage: targetStage,
          title: 'Equipment Financing & Industrial Bond Stack',
          description: `Business division capital stack modeling for production equipment.`,
          urgency: 'standard',
          blocking: false,
        },
      )
    }
  }

  if (targetStage === 'ACTIVATE') {
    signals.push({
      sourceSite: 'grounds.beamthinktank.space',
      targetDivision: 'grounds',
      assetId: asset.id,
      assetName: asset.name,
      stage: targetStage,
      title: 'Program Area & Activation Sign-off',
      description: `Grounds division final activation clearance for ${asset.name}.`,
      urgency: 'critical',
      blocking: true,
    })
  }

  if (targetStage === 'SECURE') {
    signals.push({
      sourceSite: 'grounds.beamthinktank.space',
      targetDivision: 'law',
      assetId: asset.id,
      assetName: asset.name,
      stage: targetStage,
      title: 'Deed Transfer & CLT Title Registration',
      description: `Law division deed transfer execution to Community Land Trust for ${asset.name}.`,
      urgency: 'blocking',
      blocking: true,
    })
  }

  return signals
}
